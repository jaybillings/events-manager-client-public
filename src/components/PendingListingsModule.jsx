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
 * PendingListingsModule is a generic component to display pending listings as a module within a layout.
 *
 * @class
 * @parent
 */
export default class PendingListingsModule extends Component {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   * @param {string} schema
   */
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.defaultQuery = {$sort: {name: 1}, $limit: 100};

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsTotal: 0, listingsLoaded: false, selectedListings: [],
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

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
    this.removePendingListing = this.removePendingListing.bind(this);

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
   * Code to run one component is mounted. Fetches all data and registers listeners.
   */
  componentDidMount() {
    const schemaSingular = this.schema.slice(0, -1);

    this.fetchAllData();

    /** @var {Function} this.pendingListingsService.on */
    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Added "${message.name}" as new pending ${schemaSingular}`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessagePanel({status: 'info', details: message.details});
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Updated pending ${schemaSingular} "${message.name}"`
        });
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Discarded pending ${schemaSingular} "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      });
  }

  /**
   * Code to run before component is unmounted.
   */
  componentWillUnmount() {
    /** @var {Function} this.pendingListingsService.removeAllListeners */
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
        pendingListings: message.data, pendingListingsTotal: message.total,
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
   * Creates a new listing from the data of a pending listing. Used when publishing listings.
   *
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    const id = pendingListing.id;
    delete (pendingListing.id);

    this.listingsService.create(pendingListing).then(message => {
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published "${message.name}" as new ${this.schema.slice(0, -1)} #${message.id}`
      });
      this.removePendingListing(id);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
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

    this.listingsService.update(target.id, pendingListing).then(message => {
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published ${message.name} as an update to ${target.name}`
      });
      this.removePendingListing(id);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
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
      this.props.updateMessagePanel({status: 'error', details: err});
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
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
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
    /** @var {Function} this.pendingListingsService.patch */
    return this.pendingListingsService.patch(id, newData);
  }

  /**
   * Removes single main schema listing from the database.
   *
   * @param {int} id
   */
  removePendingListing(id) {
    this.pendingListingsService.remove(id).then(message => {
      console.log(`removing ${this.schema}`, message);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the module's table column sort.
   *
   * @param {Event} e
   */
  updateColSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: columnSortState}, () => this.fetchAllData());
  }

  /**
   * Updates the modules's table page size.
   *
   * @param {Event} e
   */
  updatePageSize(e) {
    const pageSize = e.target.value;
    this.setState({pageSize: parseInt(pageSize, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * Updates the module's current table page.
   *
   * @param {string} page
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
   * De-selects all listings.
   */
  selectNoListings() {
    this.setState({selectedListings: []});
  }

  /**
   * Renders the module's table.
   *
   * @returns {[*]}
   */
  renderTable() {
    const pendingListingsTotal = this.state.pendingListingsTotal;

    if (!this.state.listingsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingListingsTotal === 0) {
      return <p>No pending {this.schema} to list.</p>
    }

    const pendingListings = this.state.pendingListings;
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const schema = this.schema;
    const selectedListings = this.state.selectedListings;
    const schemaLabel = selectedListings.length === 1 ? schema.slice(0, -1) : schema;

    return ([
      <ShowHideToggle
        key={`${schema}-module-showhide`} isVisible={isVisible} changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={`${schema}-module-body`}>
        <SelectionControl
          numSelected={selectedListings.length} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
          total={pendingListingsTotal} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={`pending-${schema}-table`}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingListings.map(listing =>
              <PendingListingRow
                key={`${this.schema}-${listing.id}`} schema={schema} listing={listing}
                selected={selectedListings.includes(listing.id)}
                updateListing={this.saveChanges} removeListing={this.removePendingListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} className={'button-primary'} onClick={this.publishListings}
                disabled={selectedListings.length === 0}>
          Publish {selectedListings.length || ''} {schemaLabel}
        </button>
        <button type={'button'} onClick={this.discardListings} disabled={selectedListings.length === 0}>
          Discard {selectedListings.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }

  /**
   * Renders the component.
   *
   * @render
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
