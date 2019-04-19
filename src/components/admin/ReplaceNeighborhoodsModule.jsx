import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, renderOptionList, uniqueListingsOnly} from "../../utilities";

export default class ReplaceNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveHoods: [], pendingHoods: [], uniqueHoods: [], hoodsLoaded: false,
      nameToReplace: '', uuidOfReplacement: ''
    };

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');
    this.vsBdNeighborhoodLookup = app.service('vs-bd-neighborhood-lookup');
    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchLiveHoodsToReplace = this.fetchLiveHoodsToReplace.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
    this.fetchPendingHoodsToReplace = this.fetchPendingHoodsToReplace.bind(this);

    this.createNeighborhoodLookup = this.createNeighborhoodLookup.bind(this);
    this.replaceAndDeleteLive = this.replaceAndDeleteLive.bind(this);
    this.replaceAndDeletePending = this.replaceAndDeletePending.bind(this);
    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    const services = new Map([
      [this.hoodsService, this.fetchAllData],
      [this.pendingHoodsService, this.fetchAllData]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher());
    }
  }

  componentWillUnmount() {
    const services = [
      this.hoodsService,
      this.pendingHoodsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });
  }

  fetchAllData() {
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  fetchHoods() {
    return this.hoodsService
      .find({query: this.defaultQuery})
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(result.data, this.state.pendingHoods);
        this.setState({liveHoods: result.data, uniqueHoods, hoodsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'neighborhoods', err, this.props.updateMessagePanel);
        this.setState({hoodsLoaded: false});
      });
  }

  fetchPendingHoods() {
    return this.pendingHoodsService
      .find({query: this.defaultQuery})
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(result.data, this.state.liveHoods);
        this.setState({pendingHoods: result.data, uniqueHoods, pendingHoodsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending neighborhoods', err, this.props.updateMessagePanel);
        this.setState({pendingHoodsLoaded: false});
      });
  }

  fetchLiveHoodsToReplace() {
    return this.hoodsService.find({query: {name: this.state.nameToReplace}});
  }

  fetchPendingHoodsToReplace() {
    return this.pendingHoodsService.find({query: {name: this.state.nameToReplace}});
  }

  createNeighborhoodLookup(targetName, replacement) {
    return this.vsBdNeighborhoodLookup.create({
      bd_region_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_hood_id: replacement.id
    });
  }

  replaceAndDeleteLive(lookupResult) {
    if (!lookupResult.total) return Promise.resolve();

    const hoodUUIDs = lookupResult.data.map(row => row.uuid);
    const replacementUUID = this.state.uuidOfReplacement;

    // Relink live venues to new live hood
    return this.venuesService
      .patch(null, {hood_uuid: replacementUUID}, {query: {hood_uuid: {$in: hoodUUIDs}}})
      .then(() => {
        // Remove original live hood listings
        return this.hoodsService.remove(null, {query: {uuid: {$in: hoodUUIDs}}});
      });
  }

  replaceAndDeletePending(liveLookupResult, pendingLookupResult) {
    if (!liveLookupResult.total && !pendingLookupResult.total) return Promise.resolve();

    const targetUUID = this.state.uuidOfReplacement;
    const liveUUIDs = liveLookupResult.total ? liveLookupResult.data.map(row => row.uuid) : [];
    const pendingUUIDs = pendingLookupResult.total ? pendingLookupResult.data.map(row => row.uuid) : [];
    const hoodUUIDs = arrayUnique([...liveUUIDs, ...pendingUUIDs]);

    // Relink pending venues to new live hood
    this.pendingVenuesService
      .patch(null, {hood_uuid: targetUUID}, {query: {hood_uuid: {$in: hoodUUIDs}}})
      .then(() => {
        // Remove original pending hood listings
        this.pendingHoodsService.remove(null, {query: {uuid: {$in: hoodUUIDs}}});
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  async handleSubmit(e) {
    e.preventDefault();

    const targetName = this.state.nameToReplace;
    const replacement = this.state.uniqueHoods.find(hood => {
      return hood.uuid === this.state.uuidOfReplacement
    });

    if (!targetName) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to enable replacing improperly cased tags.
    if (targetName === replacement.name) {
      this.props.updateMessagePanel({status: 'info', details: 'Cannot replace neighborhood with same neighborhood.'});
      return;
    }

    this.props.updateMessagePanel({status: 'info', details: 'Starting neighborhood replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for neighborhoods to replace.'});

    Promise
      .all([
        this.fetchLiveHoodsToReplace(),
        this.fetchPendingHoodsToReplace()
      ])
      .then(([liveLookupRes, pendingLookupRes]) => {
        console.log('[DEBUG] live hoods', liveLookupRes);
        console.log('[DEBUG] pending hoods', pendingLookupRes);
        this.props.updateMessagePanel({status: 'info', details: 'Relinking venues and removing neighborhoods.'});
        return Promise.all([
          this.replaceAndDeleteLive(liveLookupRes),
          this.replaceAndDeletePending(liveLookupRes, pendingLookupRes)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database.'});
        return this.createNeighborhoodLookup(targetName, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all neighborhoods named "${targetName}" with neighborhood named "${replacement.name}"`
        });
        this.setState({nameToReplace: '', uuidOfReplacement: ''});
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.log('[DEBUG]', err);
      });
  }

  render() {
    return (
      <div className={'schema-module manage-hoods'}>
        <form id={'neighborhood-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Neighborhoods</h3>
          <label>
            <span>Replace all neighborhoods (pending and live) named this:</span>
            <select name={'nameToReplace'} value={this.state.nameToReplace} onChange={this.handleListSelect}>
              {renderOptionList(this.state.uniqueHoods, 'neighborhoods', 'name')}
            </select>
          </label>
          <label>
            <span>With this neighborhood listing:</span>
            <select name={'uuidOfReplacement'} value={this.state.uuidOfReplacement} onChange={this.handleListSelect}>
              {renderOptionList(this.state.liveHoods, 'neighborhoods')}
            </select>
          </label>
          <button type={'submit'} className={'emphasize'}>Replace and Delete Neighborhood</button>
        </form>
        <div className={'module-side'}>
          <h4>Current Replacements</h4>
          <span className={'toggleShowHide'}>+</span>
        </div>
      </div>
    );
  }
};
