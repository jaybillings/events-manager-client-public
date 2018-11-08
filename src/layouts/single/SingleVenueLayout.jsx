import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import VenueRecord from "../../components/venues/VenueRecord";
import MessagePanel from "../../components/common/MessagePanel";

export default class SingleVenueLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      venue: {}, venueLoaded: false, hoods: [], hoodsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.venuesService = app.service('venues');
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
    this.venuesService
      .on('patched', message => {
        this.setState({venue: message, venueLoaded: true});
        this.updateMessagePanel({status: 'success', details: 'Changes saved'});
      })
      .on('removed', message => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.venuesService
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    //this.setState({venueLoaded: false, hoodsLoaded: false});

    this.venuesService.get(id).then(message => {
      this.setState({venue: message, venueLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  deleteVenue(id) {
    this.venuesService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveVenue(id, newData) {
    this.venuesService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    })
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
      return <p>Data is loading... Pleased be patient...</p>
    }

    return <VenueRecord
      venue={this.state.venue} hoods={this.state.hoods} saveVenue={this.saveVenue} deleteVenue={this.deleteVenue}
    />
  }

  render() {
    if (this.state.notFound) {
      return <Redirect to={'/404'} />
    }

    if (this.state.hasDeleted) {
      return <Redirect to={'/venues'} />
    }

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.venue.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
