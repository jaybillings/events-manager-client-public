import React, {Component} from 'react';
import app from '../../services/socketio';
import {
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  renderTableHeader,
  uniqueListingsOnly
} from "../../utilities";

import ReplaceTermsForm from "./ReplaceTermsForm";
import PaginationLayout from "../common/PaginationLayout";
import TermReplacementRow from "./TermReplacementRow";

export default class ReplaceNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};
    this.defaultSort = ['created_at', 1];

    this.state = {
      liveHoods: [], pendingHoods: [], uniqueHoods: [], liveHoodsLoaded: false, liveHoodsTotal: 0,
      lookups: [], lookupsTotal: 0, lookupsLoaded: false,
      sort: this.defaultSort, currentPage: 1, pageSize: this.props.defaultPageSize
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

    this.renderTable = this.renderTable.bind(this);
  }

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

  fetchAllData() {
    this.fetchReplacementLookups();

    Promise
      .all([
        this.fetchHoods(),
        this.fetchPendingHoods()
      ])
      .then(([liveHoodResult, pendingHoodResult]) => {
        const uniqueHoods = uniqueListingsOnly(liveHoodResult.data, pendingHoodResult.data);
        this.setState({
          liveHoods: liveHoodResult.data,
          pendingHoods: pendingHoodResult.data,
          uniqueHoods
        });
      })
      .catch(err => {
        displayErrorMessages('fetch', 'neighborhood data', err, this.props.updateMessagePanel);
      });
  }

  fetchHoods() {
    return this.hoodsService
      .find({query: this.defaultQuery})
      .then(results => {
        this.setState({liveHoodsLoaded: true});
        return results;
      });
  }

  fetchPendingHoods() {
    return this.pendingHoodsService.find({query: this.defaultQuery});
  }

  fetchReplacementLookups() {
    this.vsBdHoodLookupService
      .find({
        query: {
          $sort: buildSortQuery(this.state.sort, false),
          $limit: this.state.pageSize,
          $skip: this.state.pageSize * (this.state.currentPage - 1)
        }
      })
      .then(results => {
        this.setState({lookups: results.data, lookupsTotal: results.total, lookupsLoaded: true});
      })
      .catch(errors => {
        displayErrorMessages('fetch', 'neighborhood replacement data', errors,
          this.props.updateMessagePanel, 'retry');
        this.setState({lookupsLoaded: false});
      });
  }

  fetchLiveAndUpdateUnique() {
    this.fetchHoods()
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(result.data, this.state.pendingHoods);
        this.setState({liveHoods: result.data, uniqueHoods});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'live hoods', err, this.props.updateMessagePanel);
      });
  }

  fetchPendingAndUpdateUnique() {
    this.fetchPendingHoods()
      .then(result => {
        const uniqueHoods = uniqueListingsOnly(this.state.liveHoods, result.data);
        this.setState({pendingHoods: result.data, uniqueHoods});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending hoods', err, this.props.updateMessagePanel);
      });
  }

  static fetchHoodsToReplace(nameToReplace, service) {
    return service.find({query: {name: nameToReplace}});
  }

  /**
   * Updates the component's page size and respective data.
   * @param {Event} e
   */
  updatePageSize(e) {
    if (!e.target.value) return;
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * Updates the component's current page and respective data.
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * Updates the component's column sorting and respective data.
   * @param {Event} e
   */
  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchAllData());
  }

  createHoodReplacementLookup(targetName, replacement) {
    return this.vsBdHoodLookupService.create({
      bd_region_name: targetName,
      vs_hood_uuid: replacement.uuid,
      vs_hood_id: replacement.id
    });
  }

  static replaceHoodLinks(uuidOfReplacement, uuidsToReplace, linkedService) {
    return linkedService.patch(null, {hood_uuid: uuidOfReplacement}, {query: {hood_uuid: {$in: uuidsToReplace}}});
  }

  deleteHoodReplacementLookup(rowID) {
    this.vsBdHoodLookupService
      .remove(rowID)
      .catch(errors => {
        displayErrorMessages('delete', `neighborhood lookup row #${rowID}`,
          errors, this.props.updateMessagePanel, 'retry');
        this.fetchReplacementLookups();
      })
  }

  static deleteOldHoods(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

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

    this.props.updateMessagePanel({status: 'info', details: 'Starting neighborhood replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for neighborhoods to replace.'});

    const liveLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.hoodsService);
    const pendingLookupRes = await ReplaceNeighborhoodsModule.fetchHoodsToReplace(nameToReplace, this.pendingHoodsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);

    this.props.updateMessagePanel({status: 'info', details: 'Linking venues to replacement neighborhood.'});

    Promise
      .all([
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
      .then((results) => {
        console.debug('delete results', results);
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
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.error(err);
      });
  }

  renderTable() {
    if (!this.state.lookupsLoaded || !this.state.liveHoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    if (this.state.lookupsTotal === 0) {
      return <p>No neighborhood lookup rows to list.</p>;
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
        pageSize={this.state.pageSize} activePage={this.state.currentPage}
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
              runReplacement={this.runHoodReplacement}
            />;
          })
        }
        </tbody>
      </table>
    ])
  }

  render() {
    return (
      <div className={'schema-module admin-module'}>
        <h3>Replace Neighborhoods</h3>
        <ReplaceTermsForm
          schema={'neighborhoods'} uniqueListings={this.state.uniqueHoods} liveListings={this.state.liveHoods}
          runTagReplacement={this.runHoodReplacement}
        />
        <h4>Manage Neighborhood Replacements</h4>
        {this.renderTable()}
      </div>
    );
  }
};
