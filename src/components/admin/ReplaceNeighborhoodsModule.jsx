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
      liveHoods: [], pendingHoods: [], uniqueHoods: [], nameToReplace: '', uuidOfReplacement: ''
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
    this.fetchLiveHoodsToReplace = this.fetchLiveHoodsToReplace.bind(this);
    this.fetchPendingHoodsToReplace = this.fetchPendingHoodsToReplace.bind(this);

    this.createHoodLookup = this.createHoodLookup.bind(this);
    this.replaceAndDeleteLive = this.replaceAndDeleteLive.bind(this);
    this.replaceAndDeletePending = this.replaceAndDeletePending.bind(this);
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

  fetchLiveHoodsToReplace() {
    return this.hoodsService.find({query: {name: this.state.nameToReplace}});
  }

  fetchPendingHoodsToReplace() {
    return this.pendingHoodsService.find({query: {name: this.state.nameToReplace}});
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

  createHoodLookup(targetName, replacement) {
    return this.vsBdNeighborhoodLookup.create({
      bd_region_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_hood_id: replacement.id
    });
  }

  replaceAndDeleteLive(lookupResult) {
    if (!lookupResult.total) return Promise.resolve();

    const replacementUUID = this.state.uuidOfReplacement;
    const uuidsToReplace = lookupResult.data.map(row => row.uuid);

    // Relink live venues to new live hood
    return this.venuesService
      .patch(null, {hood_uuid: replacementUUID}, {query: {hood_uuid: {$in: uuidsToReplace}}})
      .then(() => {
        // Remove original live hood listings
        return this.hoodsService.remove(null, {query: {uuid: {$in: uuidsToReplace}}});
      });
  }

  replaceAndDeletePending(liveLookupResult, pendingLookupResult) {
    if (!liveLookupResult.total && !pendingLookupResult.total) return Promise.resolve();

    const replacementUUID = this.state.uuidOfReplacement;
    const liveUUIDs = liveLookupResult.total ? liveLookupResult.data.map(row => row.uuid) : [];
    const pendingUUIDs = pendingLookupResult.total ? pendingLookupResult.data.map(row => row.uuid) : [];
    const uuidsToReplace = arrayUnique([...liveUUIDs, ...pendingUUIDs]);

    // Relink pending venues to new live hood
    this.pendingVenuesService
      .patch(null, {hood_uuid: replacementUUID}, {query: {hood_uuid: {$in: uuidsToReplace}}})
      .then(() => {
        // Remove original pending hood listings
        this.pendingHoodsService.remove(null, {query: {uuid: {$in: uuidsToReplace}}});
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  doHoodReplacement(targetName, uuidOfReplacement) {
    const replacement = this.state.uniqueHoods.find(hood => {
      return hood.uuid === uuidOfReplacement
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
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace neighborhood with same neighborhood.'});
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
        return this.createHoodLookup(targetName, replacement);
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
    const uniqueHoods = this.state.uniqueHoods;
    const liveHoods = this.state.liveHoods;

    return (
      <div className={'schema-module manage-hoods'}>
        <ReplaceTermsForm schema={'neighborhoods'} uniqueListings={uniqueHoods} liveListings={liveHoods}
                          doReplacement={this.doHoodReplacement} />
        <TermReplacementsTable />
      </div>
    );
  }
};
