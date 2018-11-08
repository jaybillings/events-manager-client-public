import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import PendingVenueRecord from "../../components/pendingVenues/PendingVenueRecord";
import MessagePanel from "../../components/common/MessagePanel";

export default class SinglePendingVenueLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingVenue: {}, venueLoaded: false, hoods: [], hoodsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingVenuesService = app.service('pending-venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.saveVenue = this.saveVenue.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({venueLoaded: false});

    // Register listeners
    this.pendingVenuesService
      .on('patched', message => {
        this.setState({pendingVenue: message, venueLoaded: true});
        this.updateMessagePanel({status: 'success', details: 'Changes saved'});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingVenuesService
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingVenuesService.get(id).then(message => {
      this.setState({pendingVenue: message, venueLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    })
  }

  deleteVenue(id) {
    this.pendingVenuesService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveVenue(id, newData) {
    this.pendingVenuesService.patch(id, newData).then(message => {
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
    if (!(this.state.venueLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <PendingVenueRecord
      pendingVenue={this.state.pendingVenue} hoods={this.state.hoods} saveVenue={this.saveVenue}
      deleteVenue={this.deleteVenue}
    />
  }

  render() {
    if (this.state.notFound) {
      return <Redirect to={'/404'} />
    }

    if (this.state.hasDeleted) {
      return <Redirect to={`/import`} />
    }

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.pendingVenue.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This venue is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
