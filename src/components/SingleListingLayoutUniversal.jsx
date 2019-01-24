import React, {Component} from "react";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../services/socketio";

import Header from "../components/common/Header";
import ListingRecordUniversal from "../components/ListingRecordUniversal";
import MessagePanel from "../components/common/MessagePanel";

/**
 * SingleListingLayoutUniversal is a generic component which lays out a single listing page.
 * @class
 * @parent
 */
export default class SingleListingLayoutUniversal extends Component {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   * @param {string} schema - The schema being laid out.
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
    this.queryForExisting = this.queryForExisting.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.renderRecord = this.renderRecord.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners and fetches data.
   * @override
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
   * @override
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
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({notFound: true});
    });
  }

  /**
   * Determines whether the listing may duplicate an existing listing.
   * @async
   * @returns {Promise}
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
    this.listingsService.patch(this.state.listing.id, newData).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Removes the listing from the database by calling the service's REMOVE method.
   */
  deleteListing() {
    this.listingsService.remove(this.state.listing.id).then(() => {
      this.setState({hasDeleted: true})
    }, err => {
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
   * @note `queryForExisting` is only used in pending schema classes.
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

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

    let returnTarget, headerClass, headerTitle;

    if (this.schema.indexOf('pending') !== -1) {
      returnTarget = 'import';
      headerClass = 'block-warning';
      headerTitle = 'Caution: This event is pending. It must be pushed live before it is visible on the site.';
    } else {
      returnTarget = this.schema;
      headerClass = '';
      headerTitle = '';
    }

    if (this.state.hasDeleted) return <Redirect to={`/${returnTarget}`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={`/${returnTarget}`}>&lt; Return to {returnTarget}</Link></p>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={headerClass}><h2 title={headerTitle}>{name}</h2></div>
        {this.renderRecord()}
      </div>
    );
  }
};
