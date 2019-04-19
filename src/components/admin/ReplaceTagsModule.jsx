import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, renderOptionList, uniqueListingsOnly} from "../../utilities";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveTags: [], uniqueTags: [], pendingTags: [], tagsLoaded: false, pendingTagsLoaded: false,
      nameToReplace: '', uuidOfReplacement: ''
    };

    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.vsBdTagLookupService = app.service('vs-bd-tag-lookup');
    this.eventsTagsLookupService = app.service('events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchLiveTagsToReplace = this.fetchLiveTagsToReplace.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchPendingTagsToReplace = this.fetchPendingTagsToReplace.bind(this);

    this.createTagLookup = this.createTagLookup.bind(this);
    this.replaceAndDeleteLookups = this.replaceAndDeleteLookups.bind(this);
    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    const services = new Map([
      [this.tagsService, this.fetchTags],
      [this.pendingTagsService, this.fetchPendingTags]
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
    this.fetchTags();
    this.fetchPendingTags();
  }

  fetchTags() {
    return this.tagsService
      .find({query: this.defaultQuery})
      .then(result => {
        const uniqueTags = uniqueListingsOnly(result.data, this.state.pendingTags);
        this.setState({liveTags: result.data, uniqueTags, tagsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'tags', err, this.props.updateMessagePanel);
        this.setState({tagsLoaded: false});
      })
  }

  fetchPendingTags() {
    return this.pendingTagsService
      .find({query: this.defaultQuery})
      .then(result => {
        const uniqueTags = uniqueListingsOnly(result.data, this.state.liveTags);
        this.setState({pendingTags: result.data, uniqueTags, pendingTagsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
        this.setState({pendingTagsLoaded: false});
      })
  }

  fetchLiveTagsToReplace() {
    return this.tagsService.find({query: {name: this.state.nameToReplace.name}});
  }

  fetchPendingTagsToReplace() {
    return this.pendingTagsService.find({query: {name: this.state.nameToReplace.name}});
  }

  createTagLookup(targetName, replacement) {
    return this.vsBdTagLookupService.create({
      bd_tag_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_tag_id: replacement.id
    });
  }

  replaceAndDeleteLookups(liveLookupResult, pendingLookupResult) {
    if (!liveLookupResult.total && !pendingLookupResult.total) return Promise.resolve();

    const targetUUID = this.state.uuidOfReplacement;
    const liveUUIDs = liveLookupResult.total ? liveLookupResult.data.map(row => row.uuid) : [];
    const pendingUUIDs = pendingLookupResult.total ? pendingLookupResult.data.map(row => row.uuid) : [];
    const tagUUIDs = arrayUnique([...liveUUIDs, pendingUUIDs]);

    // TODO: Try to patch lookup row, if fail b/c unique constraint, remove
    // Relink pending events to new tag
    this.eventsTagsLookupService
      .patch(null, {tag_uuid: targetUUID}, {query: {tag_uuid: {$in: tagUUIDs}}})
      .then(() => {
        // Remove original pending tag listings
        this.pendingTagsService.remove(null, {query: {uuid: {$in: tagUUIDs}}});
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  async handleSubmit(e) {
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
      this.props.updateMessagePanel({status: 'info', details: 'Cannot replace tag with same tag.'});
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
          this.replaceAndDeleteLive(liveLookupRes),
          this.replaceAndDeleteLookups(liveLookupRes, pendingLookupRes)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database.'});
        this.createTagLookup(targetName, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all tags named "${targetName}" with tag named "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.log('[DEBUG]', err);
      });
  }

  render() {
    return (
      <div className={'schema-module manage-tags'}>
        <form id={'tag-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Tags</h3>
          <label>
            <span>Replace all tags (pending and live) named this:</span>
            <select name={'nameToReplace'} value={this.state.nameToReplace} onChange={this.handleListSelect}>
              {renderOptionList(this.state.uniqueTags, 'tags', 'name')}
            </select>
          </label>
          <label>
            <span>With this tag listing:</span>
            <select name={'uuidOfReplacement'} value={this.state.uuidOfReplacement} onChange={this.handleListSelect}>
              {renderOptionList(this.state.liveTags, 'tags')}
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
