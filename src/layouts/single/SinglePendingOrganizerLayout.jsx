import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingOrganizerRecord from '../../components/pendingOrganizers/PendingOrganizerRecord';
import MessagePanel from '../../components/common/MessagePanel';

export default class SinglePendingOrganizerLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingOrganizer: {}, orgLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingOrganizersService = app.service('pending-organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveOrganizer = this.saveOrganizer.bind(this);
    this.deleteOrganizer = this.deleteOrganizer.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({orgLoaded: false});

    // Register listeners
    this.pendingOrganizersService
      .on('patched', message => {
        const patchMsg = {'status': 'success', 'details': `Updated ${this.state.pendingOrganizer.name} successfully.`};
        this.setState({pendingOrganizer: message, orgLoaded: true});
        this.updateMessagePanel(patchMsg);
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingOrganizersService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingOrganizersService.get(id).then(message => {
      this.setState({pendingOrganizer: message, orgLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });
  }

  deleteOrganizer(id) {
    this.pendingOrganizersService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveOrganizer(id, newData) {
    this.pendingOrganizersService.patch(id, newData).then(message => {
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
    if (!this.state.orgLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord pendingOrganizer={this.state.pendingOrganizer}
                                   saveOrganizer={this.saveOrganizer} deleteOrganizer={this.deleteOrganizer} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingOrganizer.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
