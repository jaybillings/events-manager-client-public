import React, {Component} from "react";
import {Link} from "react-router-dom";
import LocalStorage from "localstorage";
import app from "../services/socketio";
import {
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  makeSingular,
  printToConsole,
  renderTableHeader
} from "../utilities";

import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";
import ListingAddForm from "./ListingAddForm";
import ListingRow from "./ListingRow";
import PaginationLayout from "./common/PaginationLayout";
import Searchbar from "./common/Searchbar";

import '../styles/schema-table.css';

/**
 * ListingsLayout is a generic component that lays out a schema collection page.
 *
 * @class
 * @parent
 * @param {String} schema
 */
export default class ListingsLayout extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {
      listings: [], listingsTotal: 0, listingsLoaded: false, newPendingListing: {},
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      filterType: 'none', searchTerm: ''
    };

    this.schema = schema;
    this.singularSchema = makeSingular(schema);
    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];
    this.defaultLimit = 3000;
    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: this.defaultLimit};

    this.localStorageObj = new LocalStorage(`vs-coe-${schema}:`);
    this.messagePanel = React.createRef();

    this.listingsService = app.service(this.schema);
    this.pendingListingsService = app.service(`pending-${this.schema}`);

    this.saveQueryState = this.saveQueryState.bind(this);
    this.loadQueryState = this.loadQueryState.bind(this);

    this.queryForMatching = this.queryForMatching.bind(this);

    this.createSearchQuery = this.createSearchQuery.bind(this);
    this.updateSearchQuery = this.updateSearchQuery.bind(this);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);

    this.createListing = this.createListing.bind(this);
    this.createPendingListing = this.createPendingListing.bind(this);
    this.updateListing = this.updateListing.bind(this);
    this.deleteListing = this.deleteListing.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColSort = this.updateColSort.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During`componentDidMount`, the component restores the table state,
   * fetches all data, and registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    const queryState = this.loadQueryState();

    this.setState(queryState, () => {
      this.fetchAllData();
    });

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Created new ${this.singularSchema} "${message.name}"`
        });
        this.fetchListings();
      })
      .on('updated', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Updated ${this.singularSchema} "${message.name}"`
        });
        this.fetchListings();
      })
      .on('patched', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Updated ${this.singularSchema} "${message.name}"`
        });
        this.fetchListings();
      })
      .on('removed', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted ${this.singularSchema} "${message.name}"`
        });
        this.fetchListings();
      });
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentWillUnmount`, the component unregisters data service
   * listeners and saves the table state to local storage.
   *
   * @override
   */
  componentWillUnmount() {
    this.saveQueryState();

    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * `saveQueryState` saves to localstorage data related to the data table state.
   */
  saveQueryState() {
    this.localStorageObj.put('queryState', {
      pageSize: this.state.pageSize,
      currentPage: this.state.currentPage,
      sort: this.state.sort,
      searchTerm: this.state.searchTerm
    });
  }

  /**
   * `loadQueryState` retrieves from localstorage data related to the data table state.
   *
   * @returns {{}}
   */
  loadQueryState() {
    const [err, queryState] = this.localStorageObj.get('queryState');
    if (err) {
      console.error(err);
      return {};
    } else return queryState;
  }

  /**
   * `queryForMatching` queries the pending service for listings with the same UUID.
   * @note Due to table constraints, this should only ever return one listing.
   *
   * @async
   * @param {string} uuid
   * @returns {Promise<{}>}
   */
  queryForMatching(uuid) {
    return this.pendingListingsService.find({query: {uuid}});
  }

  /**
   * `createSearchQuery` creates a Common API compatible text search query.
   *
   * @returns {Object}
   */
  createSearchQuery() {
    if (!this.state.searchTerm) return null;

    /** @note This syntax is specific to KNEX and may need to be changed if the adapter changes. **/
    return {'name': {$like: `%${this.state.searchTerm}%`}};
  }

  /**
   * `updateSearchQuery` updates the data table's text search term.
   *
   * @param searchTerm
   */
  updateSearchQuery(searchTerm) {
    this.setState({searchTerm}, () => {
      this.fetchListings();
    });
  }


  /**
   * `fetchAllData` fetches all data required by the layout.
   *
   * @note This function pattern exists to cut down on extraneous requests for
   * components with linked schema.
   */
  fetchAllData() {
    this.fetchListings();
  }

  /**
   * `fetchListings` fetches the primary schema's data.
   *
   * The data provided by this function is paginated and can be sorted.
   */
  fetchListings() {
    const searchFilter = this.createSearchQuery();
    const currentPage = searchFilter ? 1 : this.state.currentPage;

    const query = {
      ...searchFilter,
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (currentPage - 1)
    };

    this.listingsService.find({query})
      .then(result => {
        this.setState({listings: result.data, listingsTotal: result.total, listingsLoaded: true, currentPage: currentPage});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', this.schema, err, this.updateMessagePanel, 'reload');
        this.setState({listingsLoaded: false});
      });
  }

  /**
   * `createListing` creates a new published listing.
   *
   * @async
   * @param {Object} listingData
   * @returns {Promise<{}>}
   */
  createListing(listingData) {
    return this.listingsService
      .create(listingData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', `new ${this.singularSchema} "${listingData.name}"`,
          err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `createPendingListing` creates a new pending listing.
   *
   * @async
   * @param {object} listingData
   * @returns {Promise<{}>}
   */
  createPendingListing(listingData) {
    return this.pendingListingsService.create(listingData)
      .then(result => {
        this.setState({newPendingListing: result});
        this.updateMessagePanel({
          status: 'success',
          details: [
            <span key={'pending-message'}>Pending {this.singularSchema} "{result.name}" created.</span>,
            <Link key={'pending-link'} to={`/pending${this.schema}/${result.id}`}>Click here to edit.</Link>
          ]
        });
        return result;
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', `pending ${this.singularSchema} from ${this.singularSchema}`,
          err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Updates a given listing by calling the service's PATCH method with passed-in data.
   *
   * @async
   * @param {Object} oldListing
   * @param {object} newData
   * @returns {Promise}
   */
  updateListing(oldListing, newData) {
    console.debug(oldListing);
    return this.listingsService.patch(oldListing.id, newData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('update', `"${oldListing.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `deleteListing` deletes a single listing via the REMOVE method.
   *
   * @param {object} listing
   */
  deleteListing(listing) {
    this.listingsService.remove(listing.id)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `"${listing.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `updatePageSize` updates the component's page size, then fetches new listings.
   *
   * @param pageSize
   */
  updatePageSize(pageSize) {
    this.setState({pageSize: parseInt(pageSize, 10), currentPage: 1},
      () => this.fetchListings());
  }

  /**
   * `updateCurrentPage` updates the data table's current page, then fetches new listings.
   *
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchListings());
  }

  /**
   * `updateColSort` updates the data table's column sorting, then fetches new listings.
   *
   * @param {Event} e
   */
  updateColSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchListings());
  }

  /**
   * `updateMessagePanel` adds a message to the message panel.
   *
   * @param {Object|Array} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  /**
   * Renders the layout's data table.
   *
   * @returns {*[]|*}
   */
  renderTable() {
    if (!this.state.listingsLoaded) {
      return <div className={'message-compact single-message info'}>Data is being loaded... Please be patient...</div>;
    }

    if (this.state.listingsTotal === 0) {
      return <div className={'message-compact single-message no-content'}>No {this.schema} to list.</div>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['updated_at', 'Last Modified']
    ]);
    const schema = this.schema;

    return ([
      <PaginationLayout
        key={`${schema}-pagination`} schema={schema} total={this.state.listingsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={true}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <div className={'wrapper'} key={`${schema}-table-wrapper`}>
        <table key={`${schema}-table`} className={'schema-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            this.state.listings.map(listing =>
              <ListingRow
                key={listing.id} schema={schema} listing={listing}
                updateListing={this.updateListing} deleteListing={this.deleteListing}
                createPendingListing={this.createPendingListing} queryForMatching={this.queryForMatching}
              />)
          }
          </tbody>
        </table>
      </div>
    ]);
  }

  /**
   * Renders the form for adding a new listing.
   *
   * @returns {*}
   */
  renderAddForm() {
    if (!this.state.listingsLoaded) {
      return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;
    }

    return <ListingAddForm schema={this.schema} createListing={this.createListing}
                           createPendingListing={this.createPendingListing} />;
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.schema;

    const filterType = this.state.filterType === 'none' ? 'All' : this.state.filterType;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel ref={this.messagePanel} />
        <h2>Browse {filterType} {schema}</h2>
        <Searchbar key={`${schema}-search`} searchTerm={this.state.searchTerm}
                   updateSearchQuery={this.updateSearchQuery} />
        {this.renderTable()}
        <h2>Add New {this.singularSchema}</h2>
        {this.renderAddForm()}
      </div>
    );
  }
};
