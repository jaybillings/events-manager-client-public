import React, {Component} from 'react';
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../services/socketio";
import {MdChevronLeft} from "react-icons/md";
import {displayErrorMessages, printToConsole} from "../utilities";

import ListingRecordUniversal from "./ListingRecordUniversal";
import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";

/**
 * SingleListingLayout is a generic component which lays out the single listing view.
 *
 * @class
 * @parent
 */
export default class SingleListingLayout extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {listing: {}, listingLoaded: false, hasDeleted: false, notFound: false};

    this.schema = schema;
    this.listingID = parseInt(this.props.match.params.id, 10);
    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: 1000};
    this.messagePanel = React.createRef();

    const schemaArr = schema.split("-");
    this.listingsService = schemaArr[1] ? app.service(schemaArr[1]) : app.service(schema);
    this.pendingListingsService = schemaArr[1] ? app.service(schema) : app.service(`pending-${schema}`);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListing = this.fetchListing.bind(this);
    this.queryForDuplicate = this.queryForDuplicate.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  /**
   * Runs once the component mounts.
   *
   * During `componentDidMount`, the component fetches required data and
   * registers service listeners.
   *
   * @override
   */
  componentDidMount() {
    this.fetchAllData();

    app.service(this.schema)
      .on('patched', result => {
        if (result.id !== this.listingID) return;
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}".`});
        this.setState({listing: result, listingLoaded: true});
      })
      .on('updated', result => {
        if (result.id !== this.listingID) return;
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}".`});
        this.setState({listing: result, listingLoaded: true});
      });
  }

  /**
   * Runs when the component unmounts.
   *
   * During `componentWillUnmount`, the component unregisters service listeners.
   *
   * @override
   */
  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('patched')
      .removeAllListeners('updated')
      .removeAllListeners('removed');
  }

  /**
   * `fetchAllData` fetches all data required for the view.
   *
   * @note This function pattern exists to cut down on extraneous requests in components with linked schema.
   */
  fetchAllData() {
    this.fetchListing();
  }

  /**
   * `fetchListing` fetches data for the single listing and saves it to the state.
   */
  fetchListing() {
    this.listingsService.get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        return result;
      })
      .catch(err => {
        printToConsole(err);
        this.setState({notFound: true});
      });
  }

  /**
   * `queryForDuplicate` queries the published listings table for listings that may
   * duplicate the pending listing.
   *
   * For generic cases, it queries against the name alone.
   *
   * @async
   * @returns {Promise<*>}
   */
  queryForDuplicate() {
    return this.listingsService.find({query: {name: this.state.listing.name, $select: ['uuid']}});
  }

  /**
   * `updateListing` updates the listing's data by calling the service's PATCH method.
   *
   * @param {object} newData
   */
  updateListing(newData) {
    console.debug('updating listing');
    app.service(this.schema).patch(this.listingID, newData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('save changes to', this.state.listing.name || '', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `deleteListing` removes the listing by calling the service's REMOVE method.
   *
   * @note `hasDeleted` is set in the `then` clause because events must remove tag associations first.
   */
  deleteListing() {
    app.service(this.schema).remove(this.listingID)
      .then(() => {
        this.setState({hasDeleted: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `"${this.state.listing.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `updateMessagePanel` adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  /**
   * `renderRecord` renders the single listing's record.
   *
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <div className={'message-compact single-message info'}>Data is loading...
      Please be patient...</div>;

    return <ListingRecordUniversal
      listing={this.state.listing} schema={this.schema}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForDuplicate={this.queryForDuplicate}
    />
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    const returnTarget = this.schema;

    if (this.state.hasDeleted) return <Redirect to={`/${returnTarget}`} />;

    const listingName = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p className={'message-atom'}><Link to={`/${returnTarget}`}><MdChevronLeft />Return to {returnTarget}</Link></p>
        <MessagePanel ref={this.messagePanel} />
        <div><h2>{listingName}</h2></div>
        {this.renderRecord()}
      </div>
    );
  }
};
