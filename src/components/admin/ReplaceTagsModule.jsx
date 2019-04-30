import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, uniqueListingsOnly} from "../../utilities";

import ReplaceTermsForm from './ReplaceTermsForm';
import TermReplacementsTable from "./TermReplacementsTable";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveTags: [], uniqueTags: [], pendingTags: []
    };

    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.vsBdTagLookupService = app.service('vs-bd-tag-lookup');
    this.eventsTagsLookupService = app.service('events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchLiveAndUpdateUnique = this.fetchLiveAndUpdateUnique.bind(this);
    this.fetchPendingAndUpdateUnique = this.fetchPendingAndUpdateUnique.bind(this);

    this.createTagReplacementLookup = this.createTagReplacementLookup.bind(this);
    this.replaceTagLookups = this.replaceTagLookups.bind(this);
    this.doTagReplacement = this.doTagReplacement.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    const services = new Map([
      [this.tagsService, this.fetchLiveAndUpdateUnique],
      [this.pendingTagsService, this.fetchPendingAndUpdateUnique]
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
      this.tagsService,
      this.pendingTagsService
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
        this.fetchTags(),
        this.fetchPendingTags()
      ])
      .then(([liveTagResult, pendingTagResult]) => {
        const uniqueTags = uniqueListingsOnly(liveTagResult.data, pendingTagResult.data);
        this.setState({liveTags: liveTagResult.data, pendingTags: pendingTagResult.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'tag data', err, this.props.updateMessagePanel, 'reload');
      });
  }

  fetchTags() {
    return this.tagsService.find({query: this.defaultQuery});
  }

  fetchPendingTags() {
    return this.pendingTagsService.find({query: this.defaultQuery});
  }

  fetchLiveAndUpdateUnique() {
    this.fetchTags()
      .then(result => {
        const uniqueTags = uniqueListingsOnly(result.data, this.state.pendingTags);
        this.setState({liveTags: result.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'live tags', err, this.props.updateMessagePanel);
      });
  }

  fetchPendingAndUpdateUnique() {
    this.fetchPendingTags()
      .then(result => {
        const uniqueTags = uniqueListingsOnly(this.state.liveTags, result.data);
        this.setState({pendingTags: result.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
      });
  }

  static fetchTagsToReplace(nameToReplace, service) {
    return service.find({query: {name: nameToReplace}});
  }

  static deleteOldTags(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

  createTagReplacementLookup(targetName, replacement) {
    return this.vsBdTagLookupService.create({
      bd_keyword_name: targetName,
      vs_tag_uuid: replacement.uuid,
      vs_tag_id: replacement.id
    });
  }

  replaceTagLookups(uuidsToReplace, uuidOfReplacement) {
    return this.eventsTagsLookupService
      .remove(null, {query: {tag_uuid: {$in: uuidsToReplace}}})
      .then(result => {
        return Promise.all(result.map(lookupRow => {
          return this.eventsTagsLookupService.create({event_uuid: lookupRow.event_uuid, tag_uuid: uuidOfReplacement})
        }))
      });
  }

  /**
   *
   * @param {String} nameToReplace
   * @param {String} uuidOfReplacement
   */
  async doTagReplacement(nameToReplace, uuidOfReplacement) {
    const replacement = this.state.uniqueTags.find(tag => {
      return tag.uuid === uuidOfReplacement;
    });

    if (!nameToReplace) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to enable replacing improperly cased tags.
    if (nameToReplace === replacement.name) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace tag with same tag.'});
      return;
    }

    this.props.updateMessagePanel({status: 'info', details: 'Starting tag replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for tags to replace.'});

    const liveLookupRes = await ReplaceTagsModule.fetchTagsToReplace(nameToReplace, this.tagsService);
    const pendingLookupRes = await ReplaceTagsModule.fetchTagsToReplace(nameToReplace, this.pendingTagsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);
    const uuidsToReplace = arrayUnique([...liveUUIDsToReplace, ...pendingUUIDsToReplace]);

    this.props.updateMessagePanel({status: 'info', details: 'Relinking events.'});

    this.replaceTagLookups(uuidsToReplace, uuidOfReplacement)
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Deleting old tags.'});
        return Promise.all([
          ReplaceTagsModule.deleteOldTags(liveUUIDsToReplace, this.tagsService),
          ReplaceTagsModule.deleteOldTags(pendingUUIDsToReplace, this.pendingTagsService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database'});
        return this.createTagReplacementLookup(nameToReplace, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all tags named "${nameToReplace}" with tag named "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.error(err);
      });
  }

  render() {
    const uniqueTags = this.state.uniqueTags;
    const liveTags = this.state.liveTags;

    return (
      <div className={'schema-module manage-tags'}>
        <ReplaceTermsForm
          schema={'tags'} uniqueListings={uniqueTags} liveListings={liveTags}
          doTagReplacement={this.doTagReplacement}
        />
        <TermReplacementsTable />
      </div>
    );
  }
};
