import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import PendingOrganizerRecord from "../../components/pendingOrganizers/PendingOrganizerRecord";
import MessagePanel from "../../components/common/MessagePanel";

export default class SinglePendingOrganizerLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false, pendingOrg: {}, orgLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingOrgsService = app.service('pending-organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveOrg = this.saveOrg.bind(this);
    this.deleteOrg = this.deleteOrg.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({orgLoaded: false});

    // Register listeners
    this.pendingOrgsService
      .on('patched', message => {
        this.setState({pendingOrg: message, orgLoaded: true});
        this.updateMessagePanel({status: 'success', details: 'Changes saved'});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingOrgsService
      .removeAllListeners('patched')
      .removeAllListeners('removed')
      .removeAllListeners('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingOrgsService.get(id).then(message => {
      this.setState({pendingOrg: message, orgLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });
  }

  deleteOrg(id) {
    this.pendingOrgsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveOrg(id, newData) {
    this.pendingOrgsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  updateMessagePanel(msg) {
    this.setState({messages: [msg, ...this.state.messages], messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!this.state.orgLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord
      pendingOrg={this.state.pendingOrg} saveOrg={this.saveOrg} deleteOrg={this.deleteOrg}
    />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.pendingOrg.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
