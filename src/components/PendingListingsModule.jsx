import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, displayErrorMessages, makeSingular, renderTableHeader} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";
import SelectionControl from "./common/SelectionControl";

import '../styles/schema-module.css';
import '../styles/schema-table.css';
import Searchbar from "./common/Searchbar";

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
    this.publishPageSize = 5;
    this.maxLimit = 5000;
    this.defaultQuery = {$sort: {name: 1}, $limit: this.maxLimit, $select: ['id', 'uuid', 'name']};

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsTotal: 0, listingsLoaded: false, selectedListings: [],
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder, allIDs: []
    };

    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.listenForChanges = this.listenForChanges.bind(this);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);
    this.queryForExisting = this.queryForExisting.bind(this);
    this.queryForExact = this.queryForExact.bind(this);
    this.queryForIDs = this.queryForIDs.bind(this);
    this.queryForPublishedUUIDs = this.queryForPublishedUUIDs.bind(this);
    this.checkForLiveLinked = this.checkForLiveLinked.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.removeListing = this.removeListing.bind(this);
    this.createLiveListing = this.createLiveListing.bind(this);
    this.updateLiveListing = this.updateLiveListing.bind(this);

    this.publishListings = this.publishListings.bind(this);
    this.publishListingsRecursive = this.publishListingsRecursive.bind(this);
    this.discardListings = this.discardListings.bind(this);
    this.publishPageOfListings = this.publishPageOfListings.bind(this);

    this.handlePublishButtonClick = this.handlePublishButtonClick.bind(this);
    this.handlePublishAllClick = this.handlePublishAllClick.bind(this);

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
    this.startListening();
  }

  /**
   * Runs before component is unmounted. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.stopListening();
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

  startListening() {
    this.listenForChanges();
    this.fetchAllData();
  }

  stopListening() {
    /** @var {Function} this.pendingListingsService.removeAllListeners */
    console.debug('STOP self listening');
    this.pendingListingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  listenForChanges() {
    console.debug('START self listening');
    const schemaSingular = makeSingular(this.schema);

    /** @var {Function} this.pendingListingsService.on */
    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Created new pending ${schemaSingular} "${message.name}"`
        });
        this.fetchListings();
      })
      .on('updated', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Updated pending ${schemaSingular} "${message.name}"`
        });
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
          details: `Removed pending ${schemaSingular} "${message.name}"`
        });
        this.fetchListings();
      });
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
        pendingListings: message.data, pendingListingsTotal: message.total, listingsLoaded: true
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
    return this.pendingListingsService.find({query: {$select: ['id'], $limit: this.maxLimit}, paginate: false});
  }

  /**
   * Queries for the listing service for a list of all live IDs.
   * @async
   *
   * @returns {Promise<*>}
   */
  queryForPublishedUUIDs() {
    return this.listingsService.find({query: {$select: ['uuid', 'name'], $limit: this.maxLimit}, paginate: false});
  }

  checkForLiveLinked(pendingListing) {
    return true;
  }

  /**
   * Saves changes to main schema listing. Used in row quick-edits.
   * @async
   *
   * @param {object} oldListing
   * @param {object} newData
   * @returns {Promise<*>}
   */
  updateListing(oldListing, newData) {
    /** @var {Function} this.pendingListingsService.patch */
    return this.pendingListingsService.patch(oldListing.id, newData)
      .catch(err => {
        displayErrorMessages('update', `"${oldListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * Removes single main schema listing from the database.
   *
   * @param {Object} listing
   */
  removeListing(listing) {
    // TODO: Update message panel with success
    const schemaSingular = makeSingular(this.schema);

    return this.pendingListingsService
      .remove(listing.id)
      .then(results => {
        this.handleListingSelect(results.id, false);
      })
      .catch(err => {
        displayErrorMessages('remove', `pending ${schemaSingular} "${listing.name}"`, err, this.props.updateMessagePanel);
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

    return this.listingsService.create(listingData)
      .catch(err => {
        displayErrorMessages('publish', `pending ${this.schema} "${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * Updates a live schema listing with the pending schema's data.
   * @note Used when publishing listings.
   *
   * @param {object} pendingListing
   * @param {object} target - The listing to update.
   */
  updateLiveListing(pendingListing, target) {
    let {id, ...listingData} = pendingListing;

    return this.listingsService.update(target.id, listingData)
      .catch(err => {
        displayErrorMessages('publish', `pending ${this.schema} "${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  async publishListings(idsToPublish) {
    this.props.updateMessagePanel({status: 'success', details: `Started publishing ${this.schema}. Please wait...`});

    const liveIDs = await this.queryForPublishedUUIDs();
    const allResults = await this.publishListingsRecursive(idsToPublish, liveIDs);

    this.props.updateMessagePanel({status: 'success', details: `Finished publishing ${this.schema}`});
    this.setState({selectedListings: []});

    return allResults;
  }

  publishListingsRecursive(selectedIDs, liveIDs) {
    if (selectedIDs.length === 0) return;

    return this.publishPageOfListings(selectedIDs, liveIDs).then(result => {
      if (!result[0]) return;

      const idsToRemove = result.map(listing => {
        console.debug('listing', listing);
        return listing.id;
      });
      const newSelections = selectedIDs.filter(id => {
        return !idsToRemove.includes(id);
      });

      return this.publishListingsRecursive(newSelections, liveIDs);
    })
  }

  async publishPageOfListings(selectedIDs, liveIDs) {
    const query = {id: {$in: selectedIDs}, $limit: this.publishPageSize};

    return this.pendingListingsService.find({query, paginate: false})
      .then(result => {
        return Promise.all(result.data.map(listing => {
          if (!this.checkForLiveLinked(listing)) {
            const msg = `Cannot publish "${listing.name}" (${listing.uuid}): missing required linked schema. (Have all linked listings been published?)`;
            this.props.updateMessagePanel({status: 'error', details: msg});
            return listing;
          }

          const liveMatch = liveIDs.data.find(row => {
            return row.uuid === listing.uuid
          });

          if (liveMatch) {
            return this.updateLiveListing(listing, liveMatch)
              .then(() => {
                return this.removeListing(listing);
              });
          } else {
            return this.createLiveListing(listing)
              .then(() => {
                return this.removeListing(listing);
              });
          }
        }));
      })
      .catch(error => {
        console.debug('Error caught at module top', error);
        displayErrorMessages('publish', `pending ${this.schema}`, error, this.props.updateMessagePanel);
      });
  }

  /**
   * Removes selected main schema listings from the database. Used in row quick-edits.
   */
  discardListings() {
    const selectedCount = this.state.selectedListings.length;

    if (selectedCount === 0) return;

    const searchOptions = {paginate: false, query: {id: {$in: this.state.selectedListings}, $limit: selectedCount}};

    this.stopListening();

    return this.pendingListingsService
      .remove(null, searchOptions)
      .then(resultSet => {
        this.props.updateMessagePanel({status: 'success', details: `Deleted ${resultSet.length} ${this.schema}.`});
      })
      .catch(err => {
        displayErrorMessages('delete', `pending ${this.schema}`, err, this.props.updateMessagePanel);
        console.error(err);
      })
      .finally(() => {
        this.setState({selectedListings: []});
        this.startListening();
      });
  }

  handlePublishButtonClick() {
    this.stopListening();

    const selectedListings = this.state.selectedListings;

    this.publishListings(selectedListings).finally(() => {
      this.startListening();
    });
  }

  handlePublishAllClick() {
    // Select all first
    const allIDs = [...this.state.allIDs];

    return this.publishListings(allIDs);
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
      <button type={'button'} className={'button-primary'} onClick={this.handlePublishButtonClick}
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
        <Searchbar />
        <PaginationLayout
          key={`pending-${schema}-pagination`} schema={`pending-${schema}`} includeAll={false}
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
        <div className={'publish-buttons'}>
          {publishButton}
          <button type={'button'} className={'default'} onClick={this.discardListings}
                  disabled={selectedListings.length === 0}>
            Discard {selectedListings.length || ''} {schemaLabel}
          </button>
        </div>
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
