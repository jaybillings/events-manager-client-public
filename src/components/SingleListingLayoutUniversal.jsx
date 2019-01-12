import React, {Component} from "react";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../services/socketio";

import Header from "../components/common/Header";
import ListingRecordUniversal from "../components/ListingRecordUniversal";
import MessagePanel from "../components/common/MessagePanel";

/**
 * SingleListingLayoutUniversal is a generic component to lay out a single listing page.
 * @class
 * @parent
 */
export default class SingleListingLayoutUniversal extends Component {
  /**
   * The class's constructor.
   * @param props
   * @param schema
   */
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

  /**
   * Runs once the component mounts. Registers data service listeners.
   */
  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${message.name}"`});
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${message.name}"`});
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   */
  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('patched')
      .removeAllListeners('updated');
  }

  /**
   * Fetches all data required for the page.
   * @note This function pattern exists to cut down on extraneous requests for components with linked schema.
   */
  fetchAllData() {
    this.fetchListing();
  }

  /**
   * Fetches data for the single listing.
   */
  fetchListing() {
    this.listingsService.get(this.props.match.params.id).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      this.setState({notFound: true});
      console.log(`fetch ${this.schema} error`, JSON.stringify(err));
    });
  }

  /**
   * Updates the listing's data by calling the service's PATCH method.
   * @param {int} id
   * @param {object} listingData
   */
  updateListing(id, listingData) {
    this.listingsService.patch(id, listingData).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      console.log('error', JSON.stringify(err));
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Removes the listing from the database by calling the service's REMOVE method.
   * @param {int} id
   */
  deleteListing(id) {
    this.listingsService.remove(id).then(() => {
      this.setState({hasDeleted: true})
    }, err => {
      console.log('event delete error', JSON.stringify(err));
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Adds a message to the message panel.
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  /**
   * Prepares the message panel for dismissal by removing all messages and setting its visible state to false.
   */
  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  /**
   * Renders the single listing's record.
   *
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <ListingRecordUniversal
      listing={this.state.listing} schema={this.schema}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }

  /**
   * Renders the component.
   * @render
   * @returns {*}
   */
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
