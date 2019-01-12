import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase} from "../utilities";
import app from "../services/socketio";
import uuid from "uuid/v1";

import Header from "./common/Header";
import ListingsTable from "./ListingsTable";
import ListingAddForm from "./ListingAddForm";
import MessagePanel from "./common/MessagePanel";

/**
 * ListingsLayout is a generic component that lays out a listing collection page.
 * @class
 * @parent
 */
export default class ListingsLayout extends Component {
  /**
   * The class's constructor.
   * @param props
   * @param {string} schema - The collection's schema.
   */
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];

    this.state = {
      listings: [], listingsTotal: 0, listingsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);

    this.createListing = this.createListing.bind(this);
    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  /**
   * Runs when the component mounts. Fetches data and registers data service listeners.
   */
  componentDidMount() {
    const schemaSingular = this.schema.slice(0, -1);
    const reloadData = () => { this.setState({currentPage: 1}, () => this.fetchAllData())};

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({status: 'success', details: `Created ${schemaSingular} #${message.id} - "${message.name}"`});
        reloadData();
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Updated ${schemaSingular} #${message.id} - "${message.name}"`});
        reloadData();
      })
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Updated ${schemaSingular} #${message.id} - "${message.name}"`});
        reloadData();
      })
      .on('removed', message => {
        this.updateMessagePanel({status: 'success', details: `Permanently deleted ${schemaSingular} #${message.id} - "${message.name}"`});
        reloadData();
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   */
  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the page.
   * @note This function pattern exists to cut down on extraneous requests for components with linked schema.
   */
  fetchAllData() {
    this.fetchListings();
  }

  /**
   * Fetches data for all the published listings for a given schema. Handles filtering, sorting, and page skipping.
   */
  fetchListings() {
    this.listingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true});
    }, err => {
      console.log('could not fetch listings', err);
    });
  }

  /**
   * Creates a new listing by generating a new UUID and calling the service's CREATE method with passed-in data.
   *
   * @param {object} newData - Data for the new listing.
   * @returns {Promise}
   */
  createListing(newData) {
    // Give the new listing a UUID
    newData.uuid = uuid();

    return this.listingsService.create(newData).catch(err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates a given listing by calling the service's PATCH method with passed-in data.
   *
   * @param {int} id
   * @param {object} newData - The listing's new data.
   */
  updateListing(id, newData) {
    this.listingsService.patch(id, newData).catch(err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Delete's a given listing by calling the service's REMOVE method.
   *
   * @param {int} id
   */
  deleteListing(id) {
    this.listingsService.remove(id).catch(err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the component's page size, then fetches new listings.
   *
   * @param {Event} e
   */
  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchListings());
  }

  /**
   * Updates the component's current page, then fetches new listings.
   *
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchListings());
  }

  /**
   * Updates the component's column sorting, then fetches new listings.
   *
   * @param {Event} e
   */
  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchListings());
  }

  /**
   * Adds a message to the message panel.
   *
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
   * Renders the listing collection table.
   *
   * @returns {*}
   */
  renderTable() {
    const schema = this.schema;

    if (!this.state.listingsLoaded) {
      return <p>Data is being loaded... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No {schema} to list.</p>
    }

    const listings = this.state.listings;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.listingsTotal;
    const sort = this.state.sort;

    return <ListingsTable
      listings={listings} listingsTotal={total} schema={schema}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      updateColumnSort={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />;
  }

  /**
   * Renders the form for adding a new listing.
   *
   * @returns {*}
   */
  renderAddForm() {
    if (!this.state.listingsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <ListingAddForm schema={this.schema} createListing={this.createListing} />;
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const titleCaseSchema = makeTitleCase(this.schema);

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>All {titleCaseSchema}</h2>
        {this.renderTable()}
        <h3>Add New {titleCaseSchema.slice(0, -1)}</h3>
        {this.renderAddForm()}
      </div>
    );
  }
};
