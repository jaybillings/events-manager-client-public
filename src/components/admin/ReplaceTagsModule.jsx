import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, renderOptionList, uniqueListingsOnly} from "../../utilities";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};

    this.state = {
      liveTags: [], uniqueTags: [], pendingTags: [], tagToReplace: {}, tagReplacingWith: {},
      tagsLoaded: false
    };

    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.vsBdTagLookupService = app.service('vs-bd-tag-lookup');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.pendingEventsTagsLookupSerivce = app.service('pending-events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchLiveTagsToReplace = this.fetchLiveTagsToReplace.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchPendingTagsToReplace = this.fetchPendingTagsToReplace.bind(this);

    this.createTagLookup = this.createTagLookup.bind(this);
    this.replaceAndDeleteLive = this.replaceAndDeleteLive.bind(this);
    this.replaceAndDeletePending = this.replaceAndDeletePending.bind(this);
    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData() {
    Promise.all([
      this.fetchTags(),
      this.fetchPendingTags()
    ]).then(() => {
      const uniqueTags = uniqueListingsOnly(this.state.liveTags, this.state.pendingTags);
      this.setState({uniqueTags: uniqueTags, tagsLoaded: true});
    });
  }

  fetchTags() {
    return this.tagsService.find({query: this.defaultQuery}).then(result => {
      this.setState({liveTags: result.data});
    }, err => {
      displayErrorMessages('fetch', 'tags', err, this.props.updateMessagePanel);
      this.setState({tagsLoaded: false});
    })
  }

  fetchPendingTags() {
    return this.pendingTagsService.find({query: this.defaultQuery}).then(result => {
      this.setState({pendingTags: result.data});
    }, err => {
      displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
      this.setState({pendingTagsLoaded: false});
    })
  }

  fetchLiveTagsToReplace() {
    return this.tagsService.find({query: {name: this.state.tagToReplace.name}}).catch(err => {
      console.log(`~~~ COE Logger ~~~ Could not fetch matching live tags: ${JSON.stringify(err)}`);
    });
  }

  fetchPendingTagsToReplace() {
    return this.pendingTagsService.find({query: {name: this.state.tagToReplace.name}}).catch(err => {
      console.log(`~~~ COE Logger ~~~ Could not fetch matching pending tags: ${JSON.stringify(err)}`);
    })
  }

  createTagLookup() {
    return this.vsBdTagLookupService.create({
      bd_tag_name: this.state.tagToReplace.name,
      vs_tag_id: this.state.tagReplacingWith.id
    }).catch(err => {
      console.log(`~~~ COE Logger ~~~ Error creating tag lookup: ${JSON.stringify(err)}`);
    });
  }

  replaceAndDeleteLive(matchingTags) {
    const tagIDs = matchingTags.map(row => row.id);
    const target = this.state.tagToReplace;

    // Relink events to new tag
    this.eventsTagsLookupService.patch(null, {tag_id: target.id}, {query: {tag_id: {$in: tagIDs}}})
      .then(() => {
        // Remove original tag listings
        this.tagsService.remove(null, {query: {id: {$in: tagIDs}}}).catch(err => {
          this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        });
      }, err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  replaceAndDeletePending(matchingLiveTags, matchingPendingTags) {
    const target = this.state.tagToReplace;
    let tagUUIDs = [...matchingLiveTags.map(row => row.uuid), ...matchingPendingTags.map(row => row.uuid)];
    tagUUIDs = arrayUnique(tagUUIDs);

    // Relink pending events to new tag
    this.pendingEventsTagsLookupSerivce.patch(null, {tag_uuid: target.uuid}, {query: {tag_uuid: {$in: tagUUIDs}}})
      .then(() => {
        // Remove original pending tag listings
        this.pendingTagsService.remove(null, {query: {tag_uuid: {$in: tagUUIDs}}}).catch(err => {
          this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        });
      }, err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  async handleSubmit(e) {
    e.preventDefault();
    const target = this.state.tagToReplace;
    const replacement = this.state.tagReplacingWith;

    if (target.name.toLowerCase() === replacement.name.toLowerCase()) {
      this.props.updateMessagePanel({status: 'info', details: 'Cannot replace tag with same tag.'});
      return;
    }

    this.createTagLookup()
      .then(() => {
        return Promise.all([
          this.replaceAndDeleteLive(),
          this.replaceAndDeletePending()
        ])
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all tags named ${target.name} with tag #${replacement.id} "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
      });
  }

  render() {
    const defaultTagToReplace = this.state.uniqueTags[0] ? this.state.uniqueTags[0].id : '';
    const defaultTagReplacingWith = this.state.liveTags[0] ? this.state.liveTags[0].id : '';

    return (
      <div className={'schema-module manage-tags'}>
        <form id={'tag-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Tags</h3>
          <label>
            <span>Replace all tags (pending and live) named this:</span>
            <select name={'tagToReplace'} value={defaultTagToReplace} onChange={this.handleListSelect}>
              {renderOptionList(this.state.uniqueTags, 'tags')}
            </select>
          </label>
          <label>
            <span>With this tag listing:</span>
            <select name={'tagReplacingWith'} value={defaultTagReplacingWith} onChange={this.handleListSelect}>
              {renderOptionList(this.state.liveTags, 'tags')}
            </select>
          </label>
          <button type={'submit'} className={'emphasize'}>Replace and Delete Tag</button>
        </form>
      </div>
    );
  }
};
