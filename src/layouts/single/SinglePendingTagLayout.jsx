import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingTagRecord from '../../components/pendingTags/PendingTagRecord';
import MessagePanel from '../../components/common/MessagePanel';

export default class SinglePendingTagLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingTag: {}, tagLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingTagsService = app.service('pending-tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveTag = this.saveTag.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({tagLoaded: false});

    // Register listeners
    this.pendingTagsService
      .on('patched', message => {
        const patchMsg = {'status': 'success', 'details': `Updated ${this.state.pendingTag.name} successfully.`};
        this.setState({pendingTag: message, tagLoaded: true});
        this.updateMessagePanel(patchMsg);
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingTagsService
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingTagsService.get(id).then(message => {
      this.setState({pendingTag: message, tagLoaded: true});
    }, message => {
      // TODO: Add real logging
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteTag(id) {
    this.pendingTagsService.remove(id).then(message => console.log('delete', message));
  }

  saveTag(id, newData) {
    this.pendingTagsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: messageList.concat([msg]), messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!this.state.tagLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingTagRecord pendingTag={this.state.pendingTag} saveTag={this.saveTag} deleteTag={this.deleteTag} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    // TODO: Add 'return to import screen' button
    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingTag.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
