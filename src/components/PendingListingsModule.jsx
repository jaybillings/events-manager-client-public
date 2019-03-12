import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, displayErrorMessages, makeSingular, renderTableHeader} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";
import SelectionControl from "./common/SelectionControl";

import '../styles/schema-module.css';
import '../styles/schema-table.css';

/**
 * PendingListingsModule is a generic component that displays pending listings as a module within a layout.
 * @class
 * @parent
 */
export default class PendingListingsModule extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {Object} props
   * @param {String} schema
   */
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.user = app.get('user');
    this.defaultQuery = {$sort: {name: 1}, $limit: 1000, $select: ['id', 'uuid', 'name']};

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsTotal: 0, listingsLoaded: false, selectedListings: [],
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder, allIDs: []
    };

    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);
    this.queryForExisting = this.queryForExisting.bind(this);
    this.queryForExact = this.queryForExact.bind(this);
    this.queryForIDs = this.queryForIDs.bind(this);
    this.queryForLiveUUIDs = this.queryForLiveUUIDs.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.removeListing = this.removeListing.bind(this);
    this.createLiveListing = this.createLiveListing.bind(this);
    this.replaceLiveListing = this.replaceLiveListing.bind(this);

    this.publishListings = this.publishListings.bind(this);
    this.discardListings = this.discardListings.bind(this);

    this.updateColSort = this.updateColSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);

    this.handleListingSelect = this.handleListingSelect.bind(this);
    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);
    this.selectPageOfListings = this.selectPageOfListings.bind(this);
    this.selectAllListings = this.selectAllListings.bind(this);
    this.selectNoListings = this.selectNoListings.bind(this);

    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Code to run one component is mounted. Fetches all data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    this.fetchAllData();

    const schemaSingular = makeSingular(this.schema);

    /** @var {Function} this.pendingListingsService.on */
    this.pendingListingsService
      .on('updated', message => {
        this.props.updateMessagePanel({status: 'info', details: message.details});
        this.fetchListings();
      })
      .on('patched', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Updated pending ${schemaSingular} "${message.name}"`
        });
        this.fetchListings();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Discarded pending ${schemaSingular} "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchListings());
      })
      .on('status', message => {
        if (message.rawError) console.log(message.rawError);
        let userMessage = message.details;
        if (message.rawData) userMessage += ": " + message.rawData.dataPath + " " + message.rawData.message;
        this.props.updateMessagePanel({status: message.status, details: userMessage});
        if (message.status === 'success') {
          this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchListings());
          // TODO: WHen importing, disable normal created monitor and grab every few seconds?
        }
      });
  }

  /**
   * Runs before component is unmounted. Unregisters data service listeners.
   * @override
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
   * Runs after the component is updated. Preserves selected listings.
   * @param {Object} prevProps
   * @param {Object} prevState
   * @param {*} snapshot
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.selectedListings.count === 0 && prevState.selectedListings.count < 0) {
      this.setState({selectedListings: prevState.selectedListings});
    }
  }

  /**
   * Fetches all data for the module.
   * @note This architecture exists for listings with linked schema, so the app can be judicious about what it
   * fetches.
   */
  fetchAllData() {
    this.fetchListings();
  }

  /**
   * Fetches the main schema's data. Handles table page size, page skipping, and column sorting.
   */
  fetchListings() {
    // Get IDs of all listings
    this.queryForIDs().then(result => {
      this.setState({allIDs: result.data.map(row => row.id)});
    });

    this.pendingListingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({
        pendingListings: message.data, pendingListingsTotal: message.total,
        listingsLoaded: true
      });
    });
  }

  /**
   * Queries the live service for duplicate listings.
   * @async
   * @note Used for row status.
   *
   * @param {object} pendingListing
   * @returns {Promise<>}
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
   * @async
   * @note Used when publishing.
   *
   * @param {object} pendingListing
   * @returns {Promise<*>}
   */
  queryForExact(pendingListing) {
    return this.listingsService.find({query: {uuid: pendingListing.uuid}});
  };

  /**
   * Queries the listing service for a list of all IDs.
   * @async
   *
   * @returns {Promise<*>}
   */
  queryForIDs() {
    return this.pendingListingsService.find({query: {$select: ['id'], $limit: 5000}, paginate: false});
  }

  /**
   * Queries for the listing service for a list of all live IDs.
   * @async
   *
   * @returns {Promise<*>}
   */
  queryForLiveUUIDs() {
    return this.listingsService.find({query: {$select: ['uuid', 'name'], $limit: 5000}, paginate: false});
  }

  /**
   * Saves changes to main schema listing. Used in row quick-edits.
   * @async
   *
   * @param {int} id
   * @param {object} newData
   * @returns {Promise<*>}
   */
  updateListing(id, newData) {
    /** @var {Function} this.pendingListingsService.patch */
    return this.pendingListingsService.patch(id, newData);
  }

  /**
   * Removes single main schema listing from the database.
   *
   * @param {Object} listing
   */
  removeListing(listing) {
    console.log(`~ removing listing for ${this.schema}!`);
    return this.pendingListingsService.remove(listing.id)
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  /**
   * Creates a new listing from the data of a pending listing.
   * @note Used when publishing listings.
   *
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    let {id, ...listingData} = pendingListing;

    console.log(`~ creating live listing in ${this.schema}!`);

    return this.listingsService.create(listingData)
      .then(result => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Published "${result.name}" as new ${makeSingular(this.schema)} #${result.id}`
        });
        return this.removeListing(pendingListing);
      })
      .catch(err => {
        displayErrorMessages('publish', `"${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * Updates a live schema listing with the pending schema's data.
   * @note Used when publishing listings.
   *
   * @param {object} pendingListing
   * @param {object} target - The listing to update.
   */
  replaceLiveListing(pendingListing, target) {
    let {id, ...listingData} = pendingListing;

    console.log('~ updating live listing!');

    return this.listingsService.update(target.id, listingData)
      .then(result => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Published ${result.name} as an update to ${target.name}`
        });
        return this.removeListing(pendingListing);
      })
      .catch(err => {
        displayErrorMessages('publish', `"${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }


  /**
   * Publishes selected listings by creating or updating live listings of the same schema.
   */
  publishListings() {
    const query = this.state.selectedListings.length === 0 ? {$limit: 3000}
      : {id: {$in: this.state.selectedListings}, $limit: 3000};

    return Promise
      .all([
        this.queryForLiveUUIDs(),
        this.pendingListingsService.find({query, paginate: false})
      ])
      .then(([liveIDs, listingsToPublish]) => {
        console.log('~ liveIDs', liveIDs);
        console.log('~ listingsToPublish', listingsToPublish);
        return Promise.all(listingsToPublish.data.map(listing => {
          const liveMatch = liveIDs.data.find(row => {
            return row.uuid === listing.uuid
          });
          if (liveMatch) {
            console.log('~ matched!', liveMatch);
            return this.replaceLiveListing(listing, liveMatch);
          } else {
            return this.createLiveListing(listing);
          }
        }));
      })
      .then(allResults => {
        console.log(`~ done publishing ${this.schema}`, allResults);
        this.props.updateMessagePanel({status: 'notice', details: `Done publishing ${this.schema}`});
        return allResults;
      })
      .catch(error => {
        console.log('~ error publishing caught at top level', error);
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(error)});
      });
  }

  /**
   * Removes selected main schema listings from the database. Used in row quick-edits.
   */
  discardListings() {
    if (this.state.selectedListings.length === 0) return;

    const searchOptions = {paginate: false, query: {id: {$in: this.state.selectedListings}}};

    this.pendingListingsService.remove(null, searchOptions).catch(err => {
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
   * @param {String} page
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
   * @param {boolean} shouldAdd - True = select / False = deselect
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
   * Registers the current page of listings as selected.
   */
  selectPageOfListings() {
    const currentPageIDs = this.state.pendingListings.map(listing => listing.id);
    this.setState({selectedListings: currentPageIDs});
  }

  /**
   * Registers all listings as selected.
   */
  selectAllListings() {
    const allIds = [...this.state.allIDs];
    this.setState({selectedListings: allIds});
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
    if (!this.state.listingsLoaded) return <p>Data is loading... Please be patient...</p>;
    if (this.state.pendingListingsTotal === 0) return <p>No pending {this.schema} to list.</p>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const schema = this.schema;
    const selectedListings = this.state.selectedListings;
    const schemaLabel = selectedListings.length === 1 ? schema.slice(0, -1) : schema;
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary'} onClick={this.publishListings}
              disabled={selectedListings.length === 0}>
        Publish {selectedListings.length || ''} {schemaLabel}
      </button> : '';

    return ([
      <ShowHideToggle
        key={`${schema}-module-showhide`} isVisible={this.state.moduleVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={`${schema}-module-body`}>
        <SelectionControl
          numSelected={selectedListings.length} total={this.state.listingsTotal} schema={this.schema}
          selectPage={this.selectPageOfListings} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
          total={this.state.pendingListingsTotal} pageSize={this.state.pageSize} activePage={this.state.currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={`pending-${schema}-table`}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            this.state.pendingListings.map(listing =>
              <PendingListingRow
                key={`${this.schema}-${listing.id}`} schema={schema} listing={listing}
                selected={selectedListings.includes(listing.id)}
                updateListing={this.updateListing} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        {publishButton}
        <button type={'button'} onClick={this.discardListings} disabled={selectedListings.length === 0}>
          Discard {selectedListings.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>{this.schema}</h3>
        {this.renderTable()}
      </div>
    )
  }
}
