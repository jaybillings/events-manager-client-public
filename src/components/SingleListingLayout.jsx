import React, {Component} from 'react';
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../services/socketio";
import {displayErrorMessages} from "../utilities";

import ListingRecordUniversal from "./ListingRecordUniversal";
import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";

/**
 * SingleListingLayout is a generic component which lays out a single listing page.
 * @class
 * @parent
 */
export default class SingleListingLayout extends Component {
  /**
   * The component's constructor.
   *
   * @param props
   * @param schema - The schema to display. Supplied by child.
   */
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.listingID = this.props.match.params.id;
    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: 1000};

    this.state = {
      listing: {}, listingLoaded: false, hasDeleted: false, notFound: false,
      messagePanelVisible: false, messages: []
    };

    const schemaArr = schema.split("-");
    this.listingsService = schemaArr[1] ? app.service(schemaArr[1]) : app.service(schema);
    this.pendingListingsService = schemaArr[1] ? app.service(schema) : app.service(`pending-${schema}`);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListing = this.fetchListing.bind(this);
    this.queryForExisting = this.queryForExisting.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.renderRecord = this.renderRecord.bind(this);
  }

  /**
   * Runs once the component mounts. Fetches required data.
   * @override
   */
  componentDidMount() {
    this.fetchAllData();

    this.listingsService
      .on('patched', result => {
        if (parseInt(result.id, 10) !== parseInt(this.listingID, 10)) return;
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}".`});
        this.fetchListing();
      })
      .on('updated', result => {
        if (result.id !== this.listingID) return;
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}".`});
        this.fetchListing();
      });
  }

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
    this.listingsService
      .get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
      })
      .catch(errors => {
        this.setState({notFound: true});
        displayErrorMessages('fetch', `${this.schema} #${this.listingID}`, errors, this.updateMessagePanel);
      });
  }

  /**
   * Determines whether the listing may duplicate an existing listing.
   * @async
   *
   * @returns {Promise<*>}
   */
  queryForExisting() {
    return this.listingsService.find({
      query: {
        $or: [{uuid: this.state.listing.uuid}, {description: this.state.listing.description}, {
          name: this.state.listing.name,
        }],
        $select: ['uuid']
      }
    });
  }

  /**
   * Updates the listing's data by calling the service's PATCH method.
   * @param {object} newData
   */
  updateListing(newData) {
    app.service(this.schema).patch(this.listingID, newData)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}"`});
      })
      .catch(errors => {
        displayErrorMessages('save changes to', this.state.listing.name || '', errors, this.updateMessagePanel);
      });
  }

  /**
   * Removes the listing from the database by calling the service's REMOVE method.
   */
  deleteListing() {
    app.service(this.schema).remove(this.listingID)
      .then(() => {
        this.setState({hasDeleted: true});
      })
      .catch(errors => {
        displayErrorMessages('delete', this.state.listing.name || '', errors, this.updateMessagePanel);
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
   * @note `queryForExisting` is only used in pending schema classes.
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <ListingRecordUniversal
      listing={this.state.listing} schema={this.schema}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForExisting={this.queryForExisting}
    />
  }

  /**
   * Renders the component.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    const returnTarget = this.schema;

    if (this.state.hasDeleted) return <Redirect to={`/${returnTarget}`} />;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={`/${returnTarget}`}>&lt; Return to {returnTarget}</Link></p>
        <MessagePanel
          messages={this.state.messages} isVisible={this.state.messagePanelVisible}
          dismissPanel={this.dismissMessagePanel}
        />
        <div><h2>{this.state.listing.name}</h2></div>
        {this.renderRecord()}
      </div>
    );
  }
};
