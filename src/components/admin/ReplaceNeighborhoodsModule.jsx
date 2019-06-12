import React, {Component} from 'react';
import app from '../../services/socketio';
import {
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  printToConsole,
  renderTableHeader,
  uniqueListingsOnly
} from "../../utilities";

import ReplaceTermsForm from "./ReplaceTermsForm";
import PaginationLayout from "../common/PaginationLayout";
import TermReplacementRow from "./TermReplacementRow";

/**
 * `ReplaceNeighborhoodsModule` displays the module for replacing neighborhood terms.
 */
export default class ReplaceNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};
    this.defaultSort = ['created_at', 1];

    this.state = {
      liveHoods: [], liveHoodsLoaded: false, liveHoodsTotal: 0,
      pendingHoods: [], pendingHoodsLoaded: false, pendingHoodsTotal: 0, uniqueHoods: [],
      lookups: [], lookupsTotal: 0, lookupsLoaded: false,
      sort: this.defaultSort, currentPage: 1, pageSize: this.props.defaultPageSize,
      replaceRunning: false
    };

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');
    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.vsBdHoodLookupService = app.service('vs-bd-neighborhood-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
    this.fetchReplacementLookups = this.fetchReplacementLookups.bind(this);
    this.fetchLiveAndUpdateUnique = this.fetchLiveAndUpdateUnique.bind(this);
    this.fetchPendingAndUpdateUnique = this.fetchPendingAndUpdateUnique.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);

    this.createHoodReplacementLookup = this.createHoodReplacementLookup.bind(this);
    this.deleteHoodReplacementLookup = this.deleteHoodReplacementLookup.bind(this);

    this.runHoodReplacement = this.runHoodReplacement.bind(this);
    this.runReplacementOnly = this.runReplacementOnly.bind(this);

    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During`componentDidMount`, the component fetches all data and registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    this.fetchAllData();

    this.vsBdHoodLookupService
      .on('created', () => {
        this.fetchReplacementLookups();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Removed lookup row for replacing neighborhood named "${message.bd_region_name}"`
        });
        this.fetchReplacementLookups();
      });

    const services = new Map([
      [this.hoodsService, this.fetchLiveAndUpdateUnique],
      [this.pendingHoodsService, this.fetchPendingAndUpdateUnique]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher());
    }
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentWillUnmount`, the component unregisters data service
   * listeners..
   *
   * @override
   */
  componentWillUnmount() {
    this.vsBdHoodLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    const services = [
      this.hoodsService,
      this.pendingHoodsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });
  }

  /**
   * `fetchAllData` fetches all data required by the layout.
   */
  fetchAllData() {
    this.fetchReplacementLookups();

    Promise
      .all([
        this.fetchHoods(),
        this.fetchPendingHoods()
      ])
      .then(([liveHoodResult, pendingHoodResult]) => {
        let uniqueHoods = [];

        if (liveHoodResult.data && pendingHoodResult.data) {
          uniqueHoods = uniqueListingsOnly(liveHoodResult.data, pendingHoodResult.data);
          this.setState({uniqueHoods});
        }
      });
  }

  /**
   * `fetchHoods` fetches published hoods and saves data to the state.
   *
   * @async
   * @returns {Promise<*>}
   */
  fetchHoods() {
    return this.hoodsService.find({query: this.defaultQuery})
      .then(result => {
        if (result.total) {
          this.setState({
            liveHoods: result.data,
            liveHoodsTotal: result.total,
            liveHoodsLoaded: true
          });
        }
        return result;
      })
      .catch(err => {
        this.setState({liveHoodsLoaded: false});
        printToConsole(err);
        displayErrorMessages('fetch', 'live neighborhoods', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchPendingHoods` fetches pending neighborhoods BUT DOES NOT save them to the state.
   *
   * @async
   * @returns {Promise<*>}
   */
  fetchPendingHoods() {
    return this.pendingHoodsService.find({query: this.defaultQuery})
      .then(result => {
        console.debug(result);
        this.setState({pendingHoodsLoaded: true});
        if (result.total) {
          this.setState({
            pendingHoods: result.data,
            pendingHoodsTotal: result.total,
          });
        }
        return result;
      })
      .catch(err => {
        this.setState({pendingHoodsLoaded: false});
        printToConsole(err);
        displayErrorMessages('fetch', 'pending neighborhoods', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchReplacementLookups` fetches neighborhood replacement data and saves it to the state.
   */
  fetchReplacementLookups() {
    this.vsBdHoodLookupService.find({
      query: {
        $sort: buildSortQuery(this.state.sort, false),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    })
      .then(results => {
        this.setState({lookups: results.data, lookupsTotal: results.total, lookupsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'neighborhood replacement data', err,
          this.props.updateMessagePanel, 'retry');
        this.setState({lookupsLoaded: false});
        printToConsole(err);
      });
  }

  /**
   * `fetchLiveAndUpdateUnique` fetches live listings and updates the unique listings state.
   */
  fetchLiveAndUpdateUnique() {
    this.fetchHoods()
      .then(result => {
        if (!result.total) return;
        const uniqueHoods = uniqueListingsOnly(result.data, this.state.pendingHoods);
        this.setState({liveHoods: result.data, liveHoodsTotal: result.total, uniqueHoods});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'live hoods', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchPendingAndUpdateUnique` fetches pending listings and updates the unique listings state.
   */
  fetchPendingAndUpdateUnique() {
    this.fetchPendingHoods()
      .then(result => {
        if (!result.total) return;
        const uniqueHoods = uniqueListingsOnly(this.state.liveHoods, result.data);
        this.setState({pendingHoods: result.data, pendingHoodsTotal: result.total, uniqueHoods});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'pending hoods', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchHoodsToReplace` fetches neighborhoods that match the term to be replaced.
   *
   * @param {String} nameToReplace
   * @param {Object} service
   * @returns {Promise<*>}
   */
  static fetchHoodsToReplace(nameToReplace, service) {
    return service.find({query: {name: nameToReplace}});
  }

  /**
   * `updatePageSize` updates the component's page size, then fetches new listings.
   *
   * @param pageSize
   */
  updatePageSize(pageSize) {
    this.setState({pageSize: parseInt(pageSize, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * `updateCurrentPage` updates the data table's current page, then fetches new listings.
   *
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * `updateColumnSort` updates the data table's column sorting, then fetches new listings.
   *
   * @param {Event} e
   */
  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchAllData());
  }

  /**
   * `createHoodReplacementLookup` creates a hood replacement lookup row in the database.
   *
   * @async
   * @param {string} targetName
   * @param {Object} replacement
   * @returns {Promise<*>}
   */
  createHoodReplacementLookup(targetName, replacement) {
    return this.vsBdHoodLookupService.create({
      bd_region_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_hood_id: replacement.id
    });
  }

  /**
   * `replaceHoodLinks` replaces the hood link within a venue to the new hood.
   *
   * @async
   * @param {int|string} uuidOfReplacement
   * @param {Array} uuidsToReplace
   * @param {Object} linkedService
   * @returns {Promise<*>}
   */
  static replaceHoodLinks(uuidOfReplacement, uuidsToReplace, linkedService) {
    return linkedService.patch(null, {hood_uuid: uuidOfReplacement}, {query: {hood_uuid: {$in: uuidsToReplace}}});
  }

  /**
   * `deleteHoodReplacementLookup` deletes a hood replacement lookup row.
   *
   * @param {int} rowID
   */
  deleteHoodReplacementLookup(rowID) {
    this.vsBdHoodLookupService.remove(rowID)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `neighborhood lookup row #${rowID}`,
          err, this.props.updateMessagePanel, 'retry');
      })
      .finally(() => {
        this.fetchReplacementLookups();
      });
  }

  /**
   * `deleteOldHoods` deletes the neighborhoods that have been replaced.
   *
   * @param {Array} uuidsToRemove
   * @param {Object} service
   * @returns {Promise<*>}
   */
  static deleteOldHoods(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

  /**
   * `runHoodReplacement` runs the process to find and replace neighborhoods.
   *
   * @param {string} nameToReplace
   * @param {int|string} uuidOfReplacement
   * @returns {Promise<void>}
   */
  async runHoodReplacement(nameToReplace, uuidOfReplacement) {
    const replacement = this.state.uniqueHoods.find(hood => {
      return hood.uuid === uuidOfReplacement
    });

    if (!nameToReplace) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid neighborhood picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to enable replacing improperly cased tags.
    if (nameToReplace === replacement.name) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace neighborhood with same neighborhood.'});
      return;
    }

    this.setState({replaceRunning: true});

    this.props.updateMessagePanel({status: 'info', details: 'Starting neighborhood replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for neighborhoods to replace.'});

    const liveLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.hoodsService);
    const pendingLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.pendingHoodsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);

    this.props.updateMessagePanel({status: 'info', details: 'Linking venues to replacement neighborhood.'});

    Promise.all([
      ReplaceNeighborhoodsModule.replaceHoodLinks(replacement.uuid, liveUUIDsToReplace, this.venuesService),
      ReplaceNeighborhoodsModule.replaceHoodLinks(replacement.uuid, pendingUUIDsToReplace, this.pendingVenuesService)
    ])
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Deleting old neighborhoods.'});
        return Promise.all([
          ReplaceNeighborhoodsModule.deleteOldHoods(liveUUIDsToReplace, this.hoodsService),
          ReplaceNeighborhoodsModule.deleteOldHoods(pendingUUIDsToReplace, this.pendingHoodsService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database.'});
        return this.createHoodReplacementLookup(nameToReplace, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all neighborhoods named "${nameToReplace}" with neighborhood named "${replacement.name}"`
        });
      })
      .catch(err => {
        if (err.code === 'SQLITE_CONSTRAINT') return;
        displayErrorMessages('run', 'neighborhood replacement', err, this.props.updateMessagePanel);
        printToConsole(err);
      })
      .finally(() => this.setState({replaceRunning: false}));
  }

  /**
   * `runReplacementOnly` runs neighborhood replacement without creating lookup tables.
   *
   * @param {string} nameToReplace
   * @param {Object} replacement
   * @returns {Promise<void>}
   */
  async runReplacementOnly(nameToReplace, replacement) {
    this.setState({replaceRunning: true});

    this.props.updateMessagePanel({status: 'info', details: 'Starting neighborhood replacement.'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for neighborhoods to replace.'});

    const liveLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.hoodsService);
    const pendingLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.pendingHoodsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);

    this.props.updateMessagePanel({status: 'info', details: 'Linking venues to replacement neighborhood.'});

    Promise.all([
      ReplaceNeighborhoodsModule.replaceHoodLinks(replacement.uuid, liveUUIDsToReplace, this.venuesService),
      ReplaceNeighborhoodsModule.replaceHoodLinks(replacement.uuid, pendingUUIDsToReplace, this.pendingVenuesService)
    ])
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Deleting old neighborhoods.'});
        return Promise.all([
          ReplaceNeighborhoodsModule.deleteOldHoods(liveUUIDsToReplace, this.hoodsService),
          ReplaceNeighborhoodsModule.deleteOldHoods(pendingUUIDsToReplace, this.pendingHoodsService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all neighborhoods named "${replacement.name}" with neighborhood named "${replacement.name}"`
        });
      })
      .catch(err => {
        displayErrorMessages('run', 'neighborhood replacement', err, this.props.updateMessagePanel);
        printToConsole(err);
      })
      .finally(() => {
        this.setState({replaceRunning: false});
      });
  }

  /**
   * `renderTable` renders the lookup table.
   *
   * @returns {*[]|*}
   */
  renderTable() {
    if (!this.state.lookupsLoaded || !this.state.liveHoodsLoaded || !this.state.pendingHoodsLoaded) {
      return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;
    }

    if (this.state.lookupsTotal === 0) {
      return <div className={'message-compact single-message no-content'}>No neighborhood lookup rows to list.</div>;
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['bd_region_name', 'Neighborhood To Replace'],
      ['fk_vs_hood_id_NOSORT', 'Replacement'],
      ['created_at', 'Created On']
    ]);

    return ([
      <PaginationLayout
        key={'hood-replacement-pagination'} schema={'hood-lookups'} total={this.state.lookupsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={false}
        updateCurrentPage={this.updateCurrentPage} updatePageSize={this.updatePageSize}
      />,
      <table key={'hood-replacement-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.lookups.map(lookupRow => {
            return <TermReplacementRow
              key={lookupRow.id} lookup={lookupRow}
              listing={this.state.liveHoods.find(hood => {
                return hood.id === lookupRow.vs_hood_id;
              })}
              termToReplaceRowName={'bd_region_name'}
              deleteRow={this.deleteHoodReplacementLookup}
              runReplacementOnly={this.runReplacementOnly}
            />;
          })
        }
        </tbody>
      </table>
    ])
  }

  /**
   * Renders the component.
   *
   * @returns {*}
   */
  render() {
    return (
      <div className={'schema-module admin-module'}>
        <h3>Replace Neighborhoods</h3>
        <ReplaceTermsForm
          schema={'neighborhoods'} uniqueListings={this.state.uniqueHoods} liveListings={this.state.liveHoods}
          runReplacement={this.runHoodReplacement} replaceRunning={this.state.replaceRunning}
        />
        <h4>Manage Neighborhood Replacements</h4>
        {this.renderTable()}
      </div>
    );
  }
};
