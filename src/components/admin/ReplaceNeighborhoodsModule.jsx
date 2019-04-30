import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, uniqueListingsOnly} from "../../utilities";
import ReplaceTermsForm from "./ReplaceTermsForm";
import TermReplacementsTable from "./TermReplacementsTable";

export default class ReplaceNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveHoods: [], pendingHoods: [], uniqueHoods: []
    };

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');
    this.vsBdNeighborhoodLookup = app.service('vs-bd-neighborhood-lookup');
    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
    this.fetchLiveAndUpdateUnique = this.fetchLiveAndUpdateUnique.bind(this);
    this.fetchPendingAndUpdateUnique = this.fetchPendingAndUpdateUnique.bind(this);

    this.createHoodReplacementLookup = this.createHoodReplacementLookup.bind(this);
    this.doHoodReplacement = this.doHoodReplacement.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    const services = new Map([
      [this.hoodsService, this.fetchLiveAndUpdateUnique],
      [this.pendingHoodsService, this.fetchPendingAndUpdateUnique]
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
    Promise
      .all([
        this.fetchHoods(),
        this.fetchPendingHoods()
      ])
      .then(([liveHoodResult, pendingHoodResult]) => {
        const uniqueHoods = uniqueListingsOnly(liveHoodResult.data, pendingHoodResult.data);
        this.setState({
          liveHoods: liveHoodResult.data,
          pendingHoods: pendingHoodResult.data,
          uniqueHoods
        });
      })
      .catch(err => {
        displayErrorMessages('fetch', 'neighborhood data', err, this.props.updateMessagePanel);
      });
  }

  fetchHoods() {
    return this.hoodsService.find({query: this.defaultQuery});
  }

  fetchPendingHoods() {
    return this.pendingHoodsService.find({query: this.defaultQuery});
  }

  fetchLiveAndUpdateUnique() {
    this.fetchHoods()
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(result.data, this.state.pendingHoods);
        this.setState({liveHoods: result.data, uniqueHoods});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'live hoods', err, this.props.updateMessagePanel);
      });
  }

  fetchPendingAndUpdateUnique() {
    this.fetchPendingTags()
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(this.state.liveHoods, result.data);
        this.setState({pendingHoods: result.data, uniqueHoods});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending hoods', err, this.props.updateMessagePanel);
      });
  }

  static fetchHoodsToReplace(nameToReplace, service) {
    return service.find({query: {name: nameToReplace}});
  }

  static deleteOldHoods(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

  static replaceHoodLinks(uuidOfReplacement, uuidsToReplace, linkedService) {
    return linkedService.patch({hood_uuid: uuidOfReplacement}, {query: {hood_uuid: {$in: uuidsToReplace}}});
  }

  createHoodReplacementLookup(targetName, replacement) {
    return this.vsBdNeighborhoodLookup.create({
      bd_region_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_hood_id: replacement.id
    });
  }

  async doHoodReplacement(nameToReplace, uuidOfReplacement) {
    const replacement = this.state.uniqueHoods.find(hood => {
      return hood.uuid === uuidOfReplacement
    });

    if (!nameToReplace) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to enable replacing improperly cased tags.
    if (nameToReplace === replacement.name) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace neighborhood with same neighborhood.'});
      return;
    }

    this.props.updateMessagePanel({status: 'info', details: 'Starting neighborhood replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for neighborhoods to replace.'});

    const liveLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.hoodsService);
    const pendingLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.pendingHoodsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);

    this.props.updateMessagePanel({status: 'info', details: 'Linking venues to replacement neighborhood.'});

    Promise
      .all([
        ReplaceNeighborhoodsModule.replaceHoodLinks(liveUUIDsToReplace, this.venuesService),
        ReplaceNeighborhoodsModule.replaceHoodLinks(pendingUUIDsToReplace, this.pendingVenuesService)
      ])
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Deleting old neighborhoods.'});
        return Promise.all([
          ReplaceNeighborhoodsModule.deleteOldHoods(liveUUIDsToReplace, this.venuesService),
          ReplaceNeighborhoodsModule.deleteOldHoods(pendingUUIDsToReplace, this.pendingVenuesService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database.'});
        return this.createHoodReplacementLookup(nameToReplace, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all neighborhoods named "${nameToReplace}" with neighborhood named "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.error(err);
      });
  }

  render() {
    const uniqueHoods = this.state.uniqueHoods;
    const liveHoods = this.state.liveHoods;

    return (
      <div className={'schema-module manage-hoods'}>
        <ReplaceTermsForm
          schema={'neighborhoods'} uniqueListings={uniqueHoods} liveListings={liveHoods}
          doReplacement={this.doHoodReplacement}
        />
        <TermReplacementsTable />
      </div>
    );
  }
};
