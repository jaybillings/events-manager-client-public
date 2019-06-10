import React, {Component} from "react";
import LocalStorage from "localstorage";
import {BeatLoader} from "react-spinners";
import {
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  makeSingular,
  printToConsole,
  renderTableHeader
} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";
import SelectionControl from "./common/SelectionControl";
import Searchbar from "./common/Searchbar";

import '../styles/schema-module.css';
import '../styles/schema-table.css';

/**
 * `PendingListingsModule` is a generic component that renders a schema's data table
 * as a module.
 *
 * @class
 * @parent
 * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
 * @param {string} schema
 */
export default class PendingListingsModule extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsTotal: 0,
      listingsLoaded: false, selectedListings: [], pageSize: this.props.defaultPageSize,
      currentPage: 1, sort: this.props.defaultSortOrder, allIDs: [], searchTerm: '',
      publishRunning: false
    };

    this.schema = schema;
    this.schemaSingular = makeSingular(schema);

    this.publishPageSize = 5;
    this.maxLimit = 5000;
    this.defaultQuery = {$sort: {name: 1}, $limit: this.maxLimit, $select: ['id', 'uuid', 'name']};

    this.localStorageObj = new LocalStorage(`vs-coe-pending-${schema}`);
    this.user = app.get('user');

    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.listenForChanges = this.listenForChanges.bind(this);

    this.saveModuleState = this.saveModuleState.bind(this);
    this.loadModuleState = this.loadModuleState.bind(this);
    this.saveQueryState = this.saveQueryState.bind(this);
    this.loadQueryState = this.loadQueryState.bind(this);

    this.queryForDuplicate = this.queryForDuplicate.bind(this);
    this.queryForMatching = this.queryForMatching.bind(this);
    this.queryForIDs = this.queryForIDs.bind(this);
    this.queryForPublishedUUIDs = this.queryForPublishedUUIDs.bind(this);

    this.createSearchQuery = this.createSearchQuery.bind(this);
    this.updateSearchQuery = this.updateSearchQuery.bind(this);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchListings = this.fetchListings.bind(this);

    this.updateListing = this.updateListing.bind(this);
    this.removeListing = this.removeListing.bind(this);
    this.createLiveListing = this.createLiveListing.bind(this);
    this.updateLiveListing = this.updateLiveListing.bind(this);

    this.publishListings = this.publishListings.bind(this);
    this.publishListingsRecursive = this.publishListingsRecursive.bind(this);
    this.publishPageOfListings = this.publishPageOfListings.bind(this);
    this.discardListings = this.discardListings.bind(this);

    this.handlePublishButtonClick = this.handlePublishButtonClick.bind(this);
    this.handlePublishAllClick = this.handlePublishAllClick.bind(this);

    this.updateColSort = this.updateColSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);

    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);
    this.handleListingSelect = this.handleListingSelect.bind(this);
    this.selectPageOfListings = this.selectPageOfListings.bind(this);
    this.selectAllListings = this.selectAllListings.bind(this);
    this.selectNoListings = this.selectNoListings.bind(this);

    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During `componentDidMount`, the component restores module and table states,
   * fetches all data, and registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    const moduleState = this.loadModuleState();
    const queryState = this.loadQueryState();
    this.setState({...moduleState, ...queryState}, () => this.startListening());
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentWillUnmount`, the component unregisters data service
   * listeners and saves the module and table states to local storage.
   *
   * @override
   */
  componentWillUnmount() {
    this.stopListening();
    this.saveModuleState();
    this.saveQueryState();
  }

  /**
   * Runs after the component is updated.
   *
   * During `componentDidUpdate`, the component preserves the selected listings.
   * @note This prevents selections from being forgotten on component updates.
   *
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
   * `startListening` resumes data service listening and fetches new data.
   */
  startListening() {
    this.listenForChanges();
    this.fetchAllData();
  }

  /**
   * `stopListening` removes data service listeners.
   */
  stopListening() {
    this.pendingListingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * `listenForChanges` registers data service listeners.
   */
  listenForChanges() {
    const schemaSingular = makeSingular(this.schema);

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
          status: 'success',
          details: `Removed pending ${schemaSingular} "${message.name}"`
        });
        this.fetchListings();
      });
  }

  /**
   * `saveModuleState` saves to localstorage the visibility state of the module.
   */
  saveModuleState() {
    this.localStorageObj.put('moduleState', {moduleVisible: this.state.moduleVisible});
  }

  /**
   * `loadModuleState` retrieves from localstorage the module visibility state.
   *
   * @returns {{}}
   */
  loadModuleState() {
    const [err, moduleState] = this.localStorageObj.get('moduleState');

    if (err) {
      printToConsole(err);
      return {};
    }

    return moduleState;
  }

  /**
   * `saveQueryState` saves to localstorage data related to the data table state.
   */
  saveQueryState() {
    this.localStorageObj.put('queryState', {
      selectedListings: this.state.selectedListings,
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
      printToConsole(err);
      return {};
    }

    return queryState;
  }

  /**
   * `queryForDuplicate` queries the live service for similar listings.
   *
   * @async
   * @param {Object} pendingListing
   * @returns {Promise<{}>}
   */
  queryForDuplicate(pendingListing) {
    return this.listingsService.find({query: {name: pendingListing.name, $select: ['uuid']}});
  }

  /**
   * `queryForMatching` queries the live service for listings with the same uuid.
   * @note Due to table constraints, this should only ever return one listing.
   *
   * @async
   * @param {Object} uuid
   * @returns {Promise<{}>}
   */
  queryForMatching(uuid) {
    return this.listingsService.find({query: {uuid}});
  };

  /**
   * `queryForIDs` queries the listing service for a list of all pending listings. Selects the ID.
   *
   * @async
   * @returns {Promise<{}>}
   */
  queryForIDs() {
    return this.pendingListingsService.find({query: {$select: ['id'], $limit: this.maxLimit}, paginate: false});
  }

  /**
   * `queryForPublishedUUIDs` queries for the live listing service for all live listings. Selects the name and UUID.
   *
   * @async
   * @returns {Promise<{}>}
   */
  queryForPublishedUUIDs() {
    return this.listingsService.find({query: {$select: ['uuid', 'name'], $limit: this.maxLimit}, paginate: false});
  }

  /**
   * `createSearchQuery` creates a Common API compatible query from a search term.
   *
   * For generic schema, `createSearchQuery` matches against the name and UUID.
   *
   * @returns {Object|null}
   */
  createSearchQuery() {
    // TODO: Reset current page to 1
    if (!this.state.searchTerm) return null;

    /** @note This syntax is specific to KNEX and may need to be changed if the adapter changes. **/
    const likeClause = {$like: `%${this.state.searchTerm}%`};

    return {
      '$or': [
        {[`pending-${this.schema}.name`]: likeClause},
        {[`pending-${this.schema}.uuid`]: likeClause}
      ]
    };
  }

  /**
   * `updateSearchQuery` updates the text search query and fetches new data.
   *
   * @param {String} searchTerm
   */
  updateSearchQuery(searchTerm) {
    this.setState({searchTerm}, () => {
      this.fetchListings();
    });
  }

  /**
   * `fetchAllData` fetches data required by the module.
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
    // Get IDs of all listings for 'select all'
    this.queryForIDs().then(result => {
      this.setState({allIDs: result.data.map(row => row.id)});
    });

    // TODO: Set current page to 1 if search query

    const searchFilter = this.createSearchQuery();
    const query = {
      ...searchFilter,
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };

    this.pendingListingsService.find({query})
      .then(result => {
        this.setState({pendingListings: result.data, pendingListingsTotal: result.total, listingsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', this.schema, err, this.props.updateMessagePanel, 'reload');
        this.setState({listingsLoaded: false});
      });
  }

  /**
   * `updateListing` saves changes to a single listing via the PATCH method.
   *
   * @async
   * @param {Object} oldListing
   * @param {Object} newData
   * @returns {Promise<{}>}
   */
  updateListing(oldListing, newData) {
    /** @var {Function} this.pendingListingsService.patch */
    return this.pendingListingsService.patch(oldListing.id, newData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('update', `"${oldListing.name}"`, err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `removeListing` deletes a single listing via the REMOVE method.
   *
   * @async
   * @param {Object} listing
   * @returns {Promise<{}>}
   */
  removeListing(listing) {
    return this.pendingListingsService.remove(listing.id)
      .then(results => {
        this.handleListingSelect(results.id, false);
        return results;
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('remove', `pending ${this.schemaSingular} "${listing.name}"`,
          err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `createLiveListing` creates a live listing from pending listing data.
   *
   * @async
   * @param {Object} pendingListing
   * @returns {Promise<{}>}
   */
  createLiveListing(pendingListing) {
    let {id, ...listingData} = pendingListing;

    return this.listingsService.create(listingData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('publish', `pending ${this.schemaSingular} "${pendingListing.name}"`,
          err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `updateLiveListing` updates a live listing with pending listing data.
   *
   * @async
   * @param {Object} pendingListing
   * @param {Object} target - The listing to update.
   * @returns {Promise<{}>}
   */
  updateLiveListing(pendingListing, target) {
    let {id, ...listingData} = pendingListing;

    return this.listingsService.update(target.id, listingData)
      .catch(err => {
        printToConsole(err); // TODO: Will this happen automatically?
        displayErrorMessages('publish', `pending ${this.schemaSingular} "${pendingListing.name}"`,
          err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `publishListings` handles the publishing of a subset of listings.
   *
   * `publishListings` is the landing function for listing publishing. Once listing
   * publishing completes, the selections array is cleared.
   *
   * @async
   * @param {Array} idsToPublish
   * @returns {Promise<{}>}
   */
  async publishListings(idsToPublish) {
    this.props.updateMessagePanel({status: 'success', details: `Started publishing ${this.schema}. Please wait...`});

    const liveListingData = await this.queryForPublishedUUIDs();
    return this.publishListingsRecursive(idsToPublish, liveListingData.data);
  }

  /**
   * `publishListingsRecursive` recursively publishes a page worth of selected listings.
   *
   * `publishListingsRecursive` forces publishes to run page-by-page, which limits I/O
   * overload. It runs on a list of selections, publishing a page's worth, until none are
   * left.
   *
   * @async
   * @param {Array} selectedIDs
   * @param {Object} liveListingData
   * @returns {Promise<{}>|void}
   */
  publishListingsRecursive(selectedIDs, liveListingData) {
    if (selectedIDs.length === 0) return;

    console.debug(`${this.schema}`, selectedIDs);
    console.debug(`${this.schema}`, liveListingData);

    return this.publishPageOfListings(selectedIDs, liveListingData)
      .then(result => {
        console.debug(`${this.schema} result`, result);

        const idsToRemove = result.map(listing => {
          return listing.id;
        });
        const newSelections = selectedIDs.filter(id => {
          return !idsToRemove.includes(id);
        });

        return this.publishListingsRecursive(newSelections, liveListingData);
      });
  }

  /**
   * `publishPageOfListings` modifies the records necessary to publish a page of pending IDs.
   *
   * `publishPageOfListings` takes a page of pending IDs and either updates
   * the matching live listing or creates a new live listing, as needed. The
   * pending listings are then deleted.
   *
   * @async
   * @param {Array} selectedIDs
   * @param {Object} liveListingData
   * @returns {Promise<{Array}>}
   */
  async publishPageOfListings(selectedIDs, liveListingData) {
    const query = {id: {$in: selectedIDs}, $limit: this.publishPageSize};

    return this.pendingListingsService.find({query, paginate: false})
      .then(result => {
        return Promise.all(result.data.map(listing => {
          const liveMatch = liveListingData.find(row => {
            return row.uuid === listing.uuid
          });

          if (liveMatch) {
            return this.updateLiveListing(listing, liveMatch)
              .then(() => {
                return this.removeListing(listing);
              })
              .catch((err) => {
                printToConsole(err);
                displayErrorMessages('publish', `pending ${this.schema}`,
                  err, this.props.updateMessagePanel, 'retry');
                return listing;
              });
          } else {
            return this.createLiveListing(listing)
              .then(() => {
                return this.removeListing(listing);
              })
              .catch((err) => {
                printToConsole(err);
                displayErrorMessages('publish', `pending ${this.schema}`,
                  err, this.props.updateMessagePanel, 'retry');
                return listing
              });
          }
        }));
      })
      .catch(err => {
        console.error('top level error');
        printToConsole(err);
        displayErrorMessages('publish', `pending ${this.schema}`,
          err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `discardListings` deletes a selection of listings via the REMOVE method.
   *
   * During `discardListings`, listening is halted to avoid spamming the UX. Once
   * this function completes, the selections are cleared.
   *
   * @async
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
        printToConsole(err);
        displayErrorMessages('delete', `pending ${this.schema}`,
          err, this.props.updateMessagePanel, 'retry');
      })
      .finally(() => {
        this.setState({selectedListings: []});
        this.startListening();
      });
  }

  /**
   * `handlePublishButtonClick` handles the publish action triggered by button click.
   *
   * `handlePublishButtonClick` sets the running state to true and halts listening
   * to avoid spamming the UX.
   */
  handlePublishButtonClick() {
    this.stopListening();

    this.setState({publishRunning: true});

    const selectedListings = this.state.selectedListings;

    this.publishListings(selectedListings)
      .then(() => {
        this.setState({selectedListings: []});
        this.props.updateMessagePanel({status: 'success', details: `Finished publishing ${this.schema}.`});
      })
      .catch(err => {
        displayErrorMessages('publish', 'pending listings', err, this.props.updateMessagePanel);
        this.props.updateMessagePanel({status: 'success', details: `Finished publishing ${this.schema} with errors.`});
      })
      .finally(() => {
        this.startListening();
        this.setState({publishRunning: false});
      });

  }

  /**
   * `handlePublishAllClick` triggers the publishing of all listings in a schema.
   *
   * @returns {Promise<{}>}
   */
  handlePublishAllClick() {
    const allIDs = [...this.state.allIDs];
    return this.publishListings(allIDs)
      .then(() => {
        this.setState({selectedListings: []});
        this.props.updateMessagePanel({status: 'success', details: `Finished publishing ${this.schema}.`});
      })
      .catch(err => {
        displayErrorMessages('publish', 'pending listings', err, this.props.updateMessagePanel);
        this.props.updateMessagePanel({status: 'success', details: `Finished publishing ${this.schema} with errors.`});
      })
      .finally(() => {
        this.startListening();
        this.setState({publishRunning: false});
      });
  }

  /**
   * `updateColSort` updates the data table column sort.
   *
   * @param {Event} e
   */
  updateColSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: columnSortState}, () => this.fetchAllData());
  }

  /**
   * `updatePageSize` updates the data table page size, then fetches new data.
   *
   * @param pageSize
   */
  updatePageSize(pageSize) {
    this.setState({pageSize: parseInt(pageSize, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * `updateCurrentPage` updates the data table's current page, then fetches new data.
   *
   * @param {String} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * `toggleModuleVisibility` toggles the visibility of the module within the layout.
   */
  toggleModuleVisibility() {
    this.setState(prevState => ({moduleVisible: !prevState.moduleVisible}));
  }

  /**
   * `handleListingSelected` selects or deselects a listing.
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
   * `selectPageOfListings` selects the current page of listings.
   */
  selectPageOfListings() {
    const currentPageIDs = this.state.pendingListings.map(listing => listing.id);
    this.setState({selectedListings: currentPageIDs});
  }

  /**
   * `selectAllListings` selects all listings in the module.
   */
  selectAllListings() {
    const allIds = [...this.state.allIDs];
    this.setState({selectedListings: allIds});
  }

  /**
   * `selectNoListings` de-selects all listings.
   */
  selectNoListings() {
    this.setState({selectedListings: []});
  }

  /**
   * Renders the module's data table.
   *
   * @returns {[*]}
   */
  renderTable() {
    if (!this.state.listingsLoaded) {
      return <div className={'single-message info message-compact'}>Data is loading... Please be patient...</div>;
    }

    if (this.state.pendingListingsTotal === 0) return <div className={'message-compact single-message no-content'}>No
      pending {this.schema} to list.</div>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const schema = this.schema;
    const selectedListings = this.state.selectedListings;
    const schemaLabel = selectedListings.length === 1 ? schema.slice(0, -1) : schema;
    const spinnerClass = this.state.publishRunning ? ' button-with-spinner' : '';

    const publishButton = this.user.is_su ?
      <button type={'button'} className={`button-primary${spinnerClass}`} onClick={this.handlePublishButtonClick}
              disabled={selectedListings.length === 0}>
        <BeatLoader size={8} sizeUnit={'px'} color={'#c2edfa'} loading={this.state.publishRunning} />
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
                handleListingSelect={this.handleListingSelect}
                queryForDuplicate={this.queryForDuplicate} queryForMatching={this.queryForMatching}
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
    ]);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>{this.schema}</h3>
        <Searchbar key={`pending-${this.schema}-search`} searchTerm={this.state.searchTerm}
                   updateSearchQuery={this.updateSearchQuery} />
        {this.renderTable()}
      </div>
    )
  }
}
