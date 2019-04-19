import React, {Component} from 'react';
import app from '../../services/socketio';
import {displayErrorMessages, renderOptionList, uniqueListingsOnly} from "../../utilities";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveTags: [], uniqueTags: [], pendingTags: [], tagsLoaded: false, nameToReplace: '', uuidOfReplacement: ''
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
    this.fetchLiveTagsToReplace = this.fetchLiveTagsToReplace.bind(this);
    this.fetchPendingTagsToReplace = this.fetchPendingTagsToReplace.bind(this);

    this.createTagLookup = this.createTagLookup.bind(this);
    this.replaceAndDeleteTags = this.replaceAndDeleteTags.bind(this);
    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
        displayErrorMessages('fetch', 'tag data', err, this.props.updateMessagePanel);
      });
  }

  fetchTags() {
    return this.tagsService.find({query: this.defaultQuery});
  }

  fetchPendingTags() {
    return this.pendingTagsService.find({query: this.defaultQuery});
  }

  fetchLiveTagsToReplace() {
    return this.tagsService.find({query: {name: this.state.nameToReplace}});
  }

  fetchPendingTagsToReplace() {
    return this.pendingTagsService.find({query: {name: this.state.nameToReplace}});
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

  createTagLookup(targetName, replacement) {
    return this.vsBdTagLookupService.create({
      bd_keyword_name: targetName,
      vs_tag_uuid: replacement.uuid,
      vs_tag_id: replacement.id
    });
  }

  replaceAndDeleteTags(lookupResult, tagsService) {
    if (!lookupResult.total) return Promise.resolve();

    const targetUUID = this.state.uuidOfReplacement;
    const uuidsToReplace = lookupResult.data.map(row => row.uuid);

    // TODO: Try to patch lookup row, if fail b/c unique constraint, remove
    console.log('[DEBUG] altering lookups');
    return this.eventsTagsLookupService
      .patch(null, {tag_uuid: targetUUID}, {query: {tag_uuid: {$in: uuidsToReplace}}})
      .finally(() => {
        console.log('[DEBUG] Deleting any remaining lookups');
        return this.eventsTagsLookupService
          .remove(null, {query: {tag_uuid: {$in: uuidsToReplace}}})
          .then(() => {
            console.log('[DEBUG] Deleting old tag(s)');
            return tagsService.remove(null, {query: {uuid: {$in: uuidsToReplace}}});
          });
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  handleSubmit(e) {
    e.preventDefault();

    const targetName = this.state.nameToReplace;
    const replacement = this.state.uniqueTags.find(tag => {
      return tag.uuid === this.state.uuidOfReplacement;
    });

    if (!targetName) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to enable replacing improperly cased tags.
    if (targetName === replacement.name) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace tag with same tag.'});
      return;
    }

    this.props.updateMessagePanel({status: 'info', details: 'Starting tag replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for tags to replace.'});

    Promise
      .all([
        this.fetchLiveTagsToReplace(),
        this.fetchPendingTagsToReplace()
      ])
      .then(([liveLookupRes, pendingLookupRes]) => {
        console.log('[DEBUG] live tags', liveLookupRes);
        console.log('[DEBUG] pending tags', pendingLookupRes);
        this.props.updateMessagePanel({status: 'info', details: 'Relinking events and removing tags.'});
        return Promise.all([
          this.replaceAndDeleteTags(liveLookupRes, this.tagsService),
          this.replaceAndDeleteTags(pendingLookupRes, this.pendingTagsService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database'});
        return this.createTagLookup(targetName, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all tags named "${targetName}" with tag named "${replacement.name}"`
        });
        this.setState({nameToReplace: '', uuidOfReplacement: ''});
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.log('[DEBUG]', err);
      });
  }

  render() {
    const uniqueTags = this.state.uniqueTags;
    const liveTags = this.state.liveTags;

    /**
     * TODO: allow removing lookups from replacement table
     */
    return (
      <div className={'schema-module manage-tags'}>
        <form id={'tag-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Tags</h3>
          <label>
            <span>Replace all tags (pending and live) named this:</span>
            <select name={'nameToReplace'} value={this.state.nameToReplace} onChange={this.handleListSelect}>
              {renderOptionList(uniqueTags, 'tags', 'name')}
            </select>
          </label>
          <label>
            <span>With this tag listing:</span>
            <select name={'uuidOfReplacement'} value={this.state.uuidOfReplacement} onChange={this.handleListSelect}>
              {renderOptionList(liveTags, 'tags')}
            </select>
          </label>
          <button type={'submit'} className={'emphasize'}>Replace and Delete Tag</button>
        </form>
        <div className={'module-side'}>
          <h4>Current Replacements</h4>
          <span className={'toggleShowHide'}>+</span>
        </div>
      </div>
    );
  }
};
