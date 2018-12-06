import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase, renderTableHeader} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";
import SelectionControl from "./common/SelectionControl";

import '../styles/schema-module.css';
import '../styles/schema-table.css';

/**
 * Generic module to display pending listings as a module.
 */
export default class PendingListingsModule extends Component {
  /**
   * Constructor for PendingListingsModule
   * @constructor
   * @param {object} props
   * @param {string} schema
   */
  constructor(props, schema) {
    super(props);

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsCount: 0, listingsLoaded: false, selectedListings: [],
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.schema = schema;
    this.defaultQuery = {$sort: {name: 1}, $limit: 100};
    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchPendingListings = this.fetchPendingListings.bind(this);
    this.queryForExisting = this.queryForExisting.bind(this);
    this.queryForExact = this.queryForExact.bind(this);

    this.createLiveListing = this.createLiveListing.bind(this);
    this.updateLiveListing = this.updateLiveListing.bind(this);

    this.publishListings = this.publishListings.bind(this);
    this.discardListings = this.discardListings.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.removeListing = this.removeListing.bind(this);

    this.updateColSort = this.updateColSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);

    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);
    this.handleListingSelect = this.handleListingSelect.bind(this);
    this.selectAllListings = this.selectAllListings.bind(this);
    this.selectNoListings = this.selectNoListings.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Code to run one component is mounted.
   */
  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Added "${message.name}" as new pending ${this.schema.slice(0, -1)}`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessageList({status: 'info', details: message.details});
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Updated pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList({
          status: 'info',
          details: `Discarded pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      });
  }

  /**
   * Code to run before component is unmounted.
   */
  componentWillUnmount() {
    this.pendingListingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data for the module.
   */
  fetchAllData() {
    this.fetchPendingListings();
  }

  /**
   * Fetches the main schema's data. What is fetched is controlled by query parameters set by the table controls.
   */
  fetchPendingListings() {
    this.pendingListingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({
        pendingListings: message.data, pendingListingsCount: message.total,
        listingsLoaded: true, selectedListings: []
      });
    });
  }

  /**
   * Queries the live service for duplicate listings.
   *
   * @param {object} pendingListing
   * @returns {Promise<*>}
   */
  queryForExisting(pendingListing) {
    return this.listingsService.find({
      query: {
        $or: [{uuid: pendingListing.uuid}, {name: pendingListing.name}, {description: pendingListing.description}],
        $select: ['uuid']
      }
    });
  }

  /**
   * Queries the live service for listings with the same uuid.
   *
   * @param {object} pendingListing
   * @returns {Promise<*>}
   */
  queryForExact(pendingListing) {
    return this.listingsService.find({query: {uuid: pendingListing.uuid}});
  };

  /**
   * Creates a new listing in the live schema. Used when publishing listings.
   *
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    const id = pendingListing.id;

    delete (pendingListing.id);

    this.listingsService.create(pendingListing).then(msg => {
      console.log(`creating ${this.schema}`, msg);
      this.props.updateMessageList({
        status: 'success',
        details: `Published ${msg.name} as new ${this.schema.slice(0, -1)}`
      });
      // TODO: Look for schema that use this and update
      this.removeListing(id);
    }, err => {
      console.log(`error creating ${this.schema}`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  /**
   * Updates a live schema listing with the pending schema's data. Used when publishing listings.
   *
   * @param {object} pendingListing
   * @param {object} target
   */
  updateLiveListing(pendingListing, target) {
    const id = pendingListing.id;

    delete (pendingListing.id);

    this.listingsService.update(target.id, pendingListing).then(msg => {
      console.log(`updating ${this.schema}`, msg);
      this.props.updateMessageList({
        status: 'success',
        details: `Published ${msg.name} as update to ${target.name}`
      });
      this.removeListing(id);
    }, err => {
      console.log(`error updating ${this.schema}`, JSON.stringify(err));
      this.props.updateMessageList({status: 'error', details: err[0].message});
    });
  }

  /**
   * Publishes selected listings by creating or updating live listings of the same schema.
   */
  publishListings() {
    const query = this.state.selectedListings.length === 0 ? {} : {id: {$in: this.state.selectedListings}};
    let searchOptions = {paginate: false};

    if (query) searchOptions.query = query;

    this.pendingListingsService.find(searchOptions).then(resultSet => {
      resultSet.data.forEach(listing => {
        this.queryForExact(listing).then(result => {
          if (result.total) {
            this.updateLiveListing(listing, result.data[0]);
          } else {
            this.createLiveListing(listing);
          }
        }, err => {
          console.log(`Error querying for live event: ${err}`);
        });
      });
    }, err => {
      this.props.updateMessageList({status: 'error', details: err});
      console.log(`error publishing ${this.schema}: ${err}`);
    });
  }

  /**
   * Removes selected main schema listings from the database. Used in row quick-edits.
   */
  discardListings() {
    const query = this.state.selectedListings.length === 0 ? {} : {id: {$in: this.state.selectedListings}};
    let searchOptions = {paginate: false};

    if (query) searchOptions.query = query;

    this.pendingListingsService.remove(null, searchOptions).then(message => {
      console.log(message);
    }, err => {
      this.props.updateMessageList({status: 'error', details: err});
      console.log(`error publishing ${this.schema}: ${err}`);
    });
  }

  /**
   * Saves changes to main schema listing. Used in row quick-edits.
   *
   * @param {int} id
   * @param {object} newData
   * @returns {Promise<*>}
   */
  async saveChanges(id, newData) {
    return this.pendingListingsService.patch(id, newData);
  }

  /**
   * Removes single main schema listing from the database.
   * @param {int} id
   */
  removeListing(id) {
    this.pendingListingsService.remove(id).then(message => {
      console.log(`removing ${this.schema}`, message);
    }, err => {
      console.log(`error removing ${this.schema} error`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  /**
   * Updates the module's table column sort.
   * @param {Event} e
   */
  updateColSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: columnSortState}, () => this.fetchAllData());
  }

  /**
   * Updates the modules's table page size.
   * @param {Event} e
   */
  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * Updates the module's current table page.
   *
   * @param {int} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * Toggles the UI visibility of the module.
   */
  toggleModuleVisibility() {
    this.setState(prevState => ({moduleVisible: !prevState.moduleVisible}));
  }

  /**
   * Registers a listing as selected.
   *
   * @param {int} id
   * @param {bool} shouldAdd
   */
  handleListingSelect(id, shouldAdd) {
    const selections = this.state.selectedListings;

    if (shouldAdd) {
      selections.push(id);
      const uniqueArray = Array.from(new Set(selections));
      this.setState({selectedListings: uniqueArray});
    } else {
      const index = selections.indexOf(id);
      if (index > -1) {
        selections.splice(index, 1);
        this.setState({selectedListings: selections});
      }
    }
  }

  /**
   * Registers all listings as selected.
   */
  selectAllListings() {
    const allListingIDs = this.state.pendingListings.map(listing => listing.id);
    this.setState({selectedListings: allListingIDs});
  }

  /**
   * De-selectes all listings.
   */
  selectNoListings() {
    this.setState({selectedListings: []});
  }

  /**
   * Renders the module's table.
   * @returns {[*]}
   */
  renderTable() {
    const pendingListingsCount = this.state.pendingListingsCount;

    if (!this.state.listingsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingListingsCount === 0) {
      return <p>No pending {this.schema} to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const pendingListings = this.state.pendingListings;
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const schema = this.schema;
    const selectedListings = this.state.selectedListings;
    const numSchemaLabel = selectedListings.length || "All";
    const schemaLabel = selectedListings.length === 1 ? schema.slice(0, -1) : schema;

    return ([
      <ShowHideToggle
        key={`${schema}-module-showhide`} isVisible={isVisible} changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={`${schema}-module-body`}>
        <SelectionControl
          numSelected={selectedListings.length}
          selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
          total={pendingListingsCount} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={`pending-${schema}-table`}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingListings.map(listing =>
              <PendingListingRow
                key={`${this.schema}-${listing.id}`} schema={schema} pendingListing={listing}
                selected={selectedListings.includes(listing.id)}
                saveChanges={this.saveChanges} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} onClick={this.publishListings}>Publish {numSchemaLabel} {schemaLabel}</button>
        <button type={'button'} onClick={this.discardListings}>Discard {numSchemaLabel} {schemaLabel}</button>
      </div>
    ])
  }

  /**
   *
   * @returns {*}
   */
  render() {
    const schema = this.schema;
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>{makeTitleCase(schema)}</h3>
        {this.renderTable()}
      </div>
    )
  }
}
