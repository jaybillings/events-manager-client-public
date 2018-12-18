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
    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: 100};

    this.state = {
      listing: {}, listingLoaded: false,
      hasDeleted: false, notFound: false, messages: [], messagePanelVisible: false
    };

    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListing = this.fetchListing.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Saved changes to ${message.name}`});
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Saved changes to ${message.name}`});
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('patched')
      .removeAllListeners('updated');
  }

  fetchAllData() {
    this.fetchListing();
  }

  fetchListing() {
    this.listingsService.get(this.props.match.params.id).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      this.setState({notFound: true});
      console.log(`fetch ${this.schema} error`, JSON.stringify(err));
    });
  }

  updateListing(id, listingData) {
    this.listingsService.patch(id, listingData).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      console.log('error', err);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(() => {
      this.setState({hasDeleted: true})
    }, err => {
      console.log('event delete error', JSON.stringify(err));
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  updateMessagePanel(newMsg) {
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <ListingRecordUniversal
      listing={this.state.listing} schema={this.schema}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
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
