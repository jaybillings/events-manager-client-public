import React, {Component} from 'react';
import app from '../../services/socketio';
import {uniqueListingsOnly} from "../../utilities";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 100};

    this.state = {
      liveTags: [], uniqueTags: [], pendingTags: [], tagToReplace: [], tagReplacingWith: [],
      tagsLoaded: false
    };

    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
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
      const uniqueTags = uniqueListingsOnly(this.state.tags, this.state.pendingTags);
      this.setState({uniqueTags: uniqueTags, tagsLoaded: true});
    });
  }

  fetchTags() {}

  fetchPendingTags() {}

  handleListSelect() {}

  handleSubmit() {}

  render() {
    return (
      <div className={'schema-module manage-tags'}>
        <form id={'tag-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Tags</h3>
          <label>
            <span>Replace this tag:</span>
          </label>
          <label>
            <span>With this:</span>
          </label>
          <button type={'submit'}>Replace and Delete Tag</button>
        </form>
      </div>
    );
  }
};
