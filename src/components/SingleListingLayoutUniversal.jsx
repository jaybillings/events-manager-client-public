import React, {Component} from 'react';
import {Redirect} from 'react-router';
import {Link} from "react-router-dom";
import app from "../services/socketio";

import Header from "../components/common/Header";
import ListingRecordUniversal from "../components/ListingRecordUniversal";
import MessagePanel from "../components/common/MessagePanel";

export default class SingleListingLayoutUniversal extends Component {
  constructor(props, schema) {
    super(props);

    this.schema = schema;

    this.state = {
      messages: [], messagePanelVisible: false, listing: {}, listingLoaded: false, hasDeleted: false, notFound: false
    };

    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveListing = this.saveListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({listingLoaded: false});

    // Register listeners
    this.listingsService
      .on('patched', message => {
        this.setState({listing: message, listingLoaded: true});
        this.updateMessagePanel({status: 'success', details: 'Changes saved'});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => {
        console.log("Error handler triggered. Should post to message panel.");
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('patched')
      .removeAllListeners('removed')
      .removeAllListeners('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.listingsService.get(id).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(this.setStatus({hasDeleted: true}));
  }

  saveListing(id, listingData) {
    //this.setState({eventLoaded: false});
    this.listingsService.patch(id, listingData).then(message => {
      console.log('patching', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: [msg, ...messageList], messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: true});
  }

  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    const schema = this.schema;

    return <ListingRecordUniversal
      listing={this.state.listing} schema={schema} saveListing={this.saveListing} deleteListing={this.deleteListing}
    />
  }

  render() {
    const schema = this.schema;

    if (this.state.notFound) {
      return <Redirect to={'/404'} />
    }

    if (this.state.hasDeleted) {
      return <Redirect to={`/${schema}`} />
    }

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={`/${this.schema}`}>&lt; Return to {this.schema}</Link></p>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
