import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingTagRecord from '../../components/pendingTags/PendingTagRecord';

export default class SinglePendingTagLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {pendingTag: {}, tagLoaded: false, hasDeleted: false, notFound: false};

    this.pendingTagsService = app.service('pending-tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveTag = this.saveTag.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({tagLoaded: false});

    // Register listeners
    this.pendingTagsService
      .on('patched', message => {
        this.setState({pendingTag: message, tagLoaded: true});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.pendingTagsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingTagsService.get(id).then(message => {
      this.setState({pendingTag: message, tagLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteTag(id) {
    this.pendingTagsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveTag(id, newData) {
    this.pendingTagsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
    });
  }

  renderRecord() {
    if (!this.state.tagLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingTagRecord pendingTag={this.state.pendingTag} saveTag={this.saveTag} deleteTag={this.deleteTag}/>;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    return (
      <div className={'container'}>
        <Header />
        <div className={'block-warning'}
             title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingTag.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
