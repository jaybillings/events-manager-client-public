import React, {Component} from "react";
import {Link} from "react-router-dom";
import {buildColumnSort, buildSortQuery, displayErrorMessages, makeSingular, renderTableHeader} from "../utilities";
import app from "../services/socketio";
import uuid from "uuid/v1";

import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";
import ListingAddForm from "./ListingAddForm";
import ListingRow from "./ListingRow";
import PaginationLayout from "./common/PaginationLayout";

import '../styles/schema-table.css';

/**
 * ListingsLayout is a generic component that lays out a listing collection page.
 * @class
 * @parent
 */
export default class ListingsLayout extends Component {
  /**
   * The class's constructor.
   *
   * @param props
   * @param {string} schema - The collection's schema.
   */
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];
    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: 100};

    this.state = {
      listings: [], listingsTotal: 0, listingsLoaded: false, newPendingListing: {},
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.listingsService = app.service(this.schema);
    this.pendingListingsService = app.service(`pending-${this.schema}`);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);
    this.checkForPending = this.checkForPending.bind(this);

    this.createListing = this.createListing.bind(this);
    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);
    this.createPendingListing = this.createPendingListing.bind(this);

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
   * @override
   */
  componentDidMount() {
    const schemaSingular = this.schema.slice(0, -1);
    const reloadData = () => {
      this.setState({currentPage: 1}, () => this.fetchListings())
    };

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Created ${schemaSingular} #${message.id} - "${message.name}"`
        });
        reloadData();
      })
      .on('updated', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Updated ${schemaSingular} #${message.id} - "${message.name}"`
        });
        reloadData();
      })
      .on('patched', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Updated ${schemaSingular} #${message.id} - "${message.name}"`
        });
        reloadData();
      })
      .on('removed', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted ${schemaSingular} #${message.id} - "${message.name}"`
        });
        reloadData();
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the table.
   * @note This function pattern exists to cut down on extraneous requests for components with linked schema.
   */
  fetchAllData() {
    this.fetchListings();
  }

  /**
   * Fetches data for all the published listings for a given schema. Handles table page size, page skipping,
   * and column sorting.
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
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({listingsLoaded: false});
    });
  }

  /**
   * Queries for pending schema listings that have a given UUID. Used to check for pending listings duplicating
   * a live listing.
   *
   * @param {string} uuid
   * @returns {Promise}
   */
  checkForPending(uuid) {
    return this.pendingListingsService.find({query: {uuid}});
  }

  /**
   * Creates a new listing by generating a new UUID and calling the service's CREATE method with passed-in data.
   *
   * @param {object} listingData - Data for the new listing.
   * @returns {Promise}
   */
  createListing(listingData) {
    listingData.uuid = uuid();

    return this.listingsService.create(listingData).catch(err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates a given listing by calling the service's PATCH method with passed-in data.
   *
   * @param {int} id
   * @param {object} newData
   * @returns {Promise}
   */
  updateListing(id, newData) {
    return this.listingsService.patch(id, newData).catch(err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Deletes a given listing by calling the service's REMOVE method.
   *
   * @param {int} id
   */
  deleteListing(id) {
    this.listingsService.remove(id).catch(err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Creates a pending listing that duplicates the given data from a live listing.
   *
   * @param {object} listingData
   * @returns {Promise}
   */
  createPendingListing(listingData) {
    return app.service(`pending-${this.schema}`).create(listingData).then(message => {
      this.setState({newPendingListing: message});
      this.updateMessagePanel({
        status: 'success',
        details: `Pending ${makeSingular(this.schema)} "${message.name}" created.`
      });
    }, errors => {
      displayErrorMessages('copy', listingData.name, errors, this.updateMessagePanel);
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

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['updated_at', 'Last Modified']
    ]);

    return ([
      <PaginationLayout
        key={`${schema}-pagination`} schema={schema} total={this.state.listingsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <table key={`${schema}-table`} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.listings.map(listing =>
            <ListingRow
              key={listing.id} schema={schema} listing={listing}
              updateListing={this.updateListing} deleteListing={this.deleteListing}
              createPendingListing={this.createPendingListing} checkForPending={this.checkForPending}
            />
          )
        }
        </tbody>
      </table>
    ]);
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

    return <ListingAddForm
      schema={this.schema} createListing={this.createListing} createPendingListing={this.createPendingListing}
    />;
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const schema = this.schema;
    const pendingListing = this.state.newPendingListing;

    let pendingListingLink = pendingListing.id ? <div className={'pending-link'}>
      <Link to={`/pending${this.schema}/${pendingListing.id}`}>Click here to edit {pendingListing.name}</Link>
    </div> : '';

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        {pendingListingLink}
        <h2>All {schema}</h2>
        {this.renderTable()}
        <h3>Add New {makeSingular(schema)}</h3>
        {this.renderAddForm()}
      </div>
    );
  }
};
