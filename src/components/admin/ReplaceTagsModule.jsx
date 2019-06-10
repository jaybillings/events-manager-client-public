import React, {Component} from 'react';
import app from '../../services/socketio';
import {
  arrayUnique,
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages, printToConsole,
  renderTableHeader,
  uniqueListingsOnly
} from "../../utilities";

import ReplaceTermsForm from './ReplaceTermsForm';
import PaginationLayout from "../common/PaginationLayout";
import TermReplacementRow from "./TermReplacementRow";

/**
 * `ReplaceTagsModule` displays the module for replacing tags terms.
 */
export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};
    this.defaultSort = ['created_at', 1];

    this.state = {
      liveTags: [], liveTagsLoaded: false, liveTagsTotal: 0,
      pendingTags: [], pendingTagsLoaded: false, pendingTagsTotal: 0, uniqueTags: [],
      lookups: [], lookupsTotal: 0, lookupsLoaded: false,
      sort: this.defaultSort, currentPage: 1, pageSize: this.props.defaultPageSize,
      replaceRunning: false
    };

    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');
    this.vsBdTagLookupService = app.service('vs-bd-tag-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchReplacementLookups = this.fetchReplacementLookups.bind(this);
    this.fetchLiveAndUpdateUnique = this.fetchLiveAndUpdateUnique.bind(this);
    this.fetchPendingAndUpdateUnique = this.fetchPendingAndUpdateUnique.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);

    this.createTagReplacementLookup = this.createTagReplacementLookup.bind(this);
    this.deleteTagReplacementLookup = this.deleteTagReplacementLookup.bind(this);

    this.replaceEventTagMappings = this.replaceEventTagMappings.bind(this);
    this.runTagReplacement = this.runTagReplacement.bind(this);

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

    this.vsBdTagLookupService
      .on('created', () => {
        this.fetchReplacementLookups();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Removed lookup row for replacing tag named "${message.bd_keyword_name}."`
        });
        this.fetchReplacementLookups();
      });

    const services = new Map([
      [this.tagsService, this.fetchLiveAndUpdateUnique],
      [this.pendingTagsService, this.fetchPendingAndUpdateUnique]
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
    this.vsBdTagLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    const services = [
      this.tagsService,
      this.pendingTagsService
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
        this.fetchTags(),
        this.fetchPendingTags()
      ])
      .then(([liveTagResult, pendingTagResult]) => {
        let uniqueTags = [];

        if (liveTagResult.data && pendingTagResult.data) {
          uniqueTags = uniqueListingsOnly(liveTagResult.data, pendingTagResult.data);
          this.setState({uniqueTags});
        }
      });
  }

  /**
   * `fetchTags` fetches published tags and saves data to the state.
   *
   * @async
   * @returns {Promise<*>}
   */
  fetchTags() {
    return this.tagsService.find({query: this.defaultQuery})
      .then(result => {
        if (result.total) {
          this.setState({
            liveTags: result.data,
            liveTagsTotal: result.data.total,
            liveTagsLoaded: true
          });
        }
        return result;
      })
      .catch(err => {
        this.setState({liveTagsLoaded: false});
        printToConsole(err);
        displayErrorMessages('fetch', 'live tags', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchPendingTags` fetches pending tags and saves data to the state.
   *
   * @returns {Promise<*>}
   */
  fetchPendingTags() {
    return this.pendingTagsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({pendingTagsLoaded: true});
        if (result.total) {
          this.setState({
            pendingTags: result.data,
            pendingTagsTotal: result.total
          });
        }
        return result;
      })
      .catch(err => {
        this.setState({pendingTagsLoaded: false});
        printToConsole(err);
        displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchReplacementLookups` fetches tag replacement data and saves it to the state.
   */
  fetchReplacementLookups() {
    this.vsBdTagLookupService
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
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'tag replacement data', err,
          this.props.updateMessagePanel, 'retry');
        this.setState({lookupsLoaded: false});
      });
  }

  /**
   * `fetchLiveAndUpdateUnique` fetches live listings and updates the unique listings state.
   */
  fetchLiveAndUpdateUnique() {
    this.fetchTags()
      .then(result => {
        if (!result.total) return;
        const uniqueTags = uniqueListingsOnly(result.data, this.state.pendingTags);
        this.setState({liveTags: result.data, uniqueTags});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'live tags', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchPendingAndUpdateUnique` fetches pending listings and updates the unique listings state.
   */
  fetchPendingAndUpdateUnique() {
    this.fetchPendingTags()
      .then(result => {
        if (!result.total) return;
        const uniqueTags = uniqueListingsOnly(this.state.liveTags, result.data);
        this.setState({pendingTags: result.data, uniqueTags});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
      });
  }

  /**
   * `fetchTagsToReplace` fetches tags that match the term to be replaced.
   *
   * @param {String} nameToReplace
   * @param {Object} service
   * @returns {Promise<*>}
   */
  static fetchTagsToReplace(nameToReplace, service) {
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
   * `createTagReplacementLookup` creates a tag replacement lookup row in the database.
   *
   * @async
   * @param {string} targetName
   * @param {Object} replacement
   * @returns {Promise<*>}
   */
  createTagReplacementLookup(targetName, replacement) {
    return this.vsBdTagLookupService.create({
      bd_keyword_name: targetName,
      vs_tag_uuid: replacement.uuid,
      vs_tag_id: replacement.id
    });
  }

  /**
   * `deleteTagReplacementLookup` removes a replacement lookup row.
   *
   * @param {int} rowID
   */
  deleteTagReplacementLookup(rowID) {
    this.vsBdTagLookupService.remove(rowID)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `tag lookup row #${rowID}`,
          err, this.props.updateMessagePanel, 'retry');
      })
      .finally(() => {
        this.fetchReplacementLookups();
      });
  }

  /**
   * `replaceEventTagMappings` replaces the lookup rows linking an event to a tag,
   * so the new tag can be linked.
   *
   * @param {Array} uuidsToReplace
   * @param {int|string} uuidOfReplacement
   * @param {Object} service
   * @returns {Promise<*>}
   */
  replaceEventTagMappings(uuidsToReplace, uuidOfReplacement, service) {
    return service.remove(null, {query: {tag_uuid: {$in: uuidsToReplace}}})
      .then(result => {
        return Promise.all(result.map(lookupRow => {
          return service.create({event_uuid: lookupRow.event_uuid, tag_uuid: uuidOfReplacement})
        }))
      });
  }

  /**
   * `deleteOldTags` deletes the tags that have been replaced.
   *
   * @param {Array} uuidsToRemove
   * @param {Object} service
   * @returns {Promise<*>}
   */
  static deleteOldTags(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

  /**
   * `runTagReplacement`runs the process to find and replace tags.
   *
   * @param {String} nameToReplace
   * @param {String|int} uuidOfReplacement
   * @returns {Proimse<*>}
   */
  async runTagReplacement(nameToReplace, uuidOfReplacement) {
    const replacement = this.state.uniqueTags.find(tag => {
      return tag.uuid === uuidOfReplacement;
    });

    if (!nameToReplace) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked to be replaced.'});
      return;
    }

    if (!replacement) {
      this.props.updateMessagePanel({status: 'error', details: 'Invalid tag picked as replacement'});
      return;
    }

    // This is intentionally case sensitive to avoid unintended side-effects
    if (nameToReplace === replacement.name) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace tag with same tag.'});
      return;
    }

    this.setState({replaceRunning: true});

    this.props.updateMessagePanel({status: 'info', details: 'Starting tag replacement'});
    this.props.updateMessagePanel({status: 'info', details: 'Looking for tags to replace.'});

    const liveLookupRes = await ReplaceTagsModule.fetchTagsToReplace(nameToReplace, this.tagsService);
    const pendingLookupRes = await ReplaceTagsModule.fetchTagsToReplace(nameToReplace, this.pendingTagsService);

    const liveUUIDsToReplace = liveLookupRes.data.map(row => row.uuid);
    const pendingUUIDsToReplace = pendingLookupRes.data.map(row => row.uuid);
    const uuidsToReplace = arrayUnique([...liveUUIDsToReplace, ...pendingUUIDsToReplace]);

    this.props.updateMessagePanel({status: 'info', details: 'Relinking events.'});

    Promise
      .all([
        this.replaceEventTagMappings(uuidsToReplace, uuidOfReplacement, this.eventsTagsLookupService),
        this.replaceEventTagMappings(uuidsToReplace, uuidOfReplacement, this.pendingEventsTagsLookupService)
      ])
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Deleting old tags.'});
        return Promise.all([
          ReplaceTagsModule.deleteOldTags(liveUUIDsToReplace, this.tagsService),
          ReplaceTagsModule.deleteOldTags(pendingUUIDsToReplace, this.pendingTagsService)
        ]);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: 'Creating replacement lookup row in database'});
        return this.createTagReplacementLookup(nameToReplace, replacement);
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all tags named "${nameToReplace}" with tag named "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
        console.error(err);
      })
      .finally(() => this.setState({replaceRunning: false}));
  }

  /**
   * `renderTable` renders the lookup table.
   *
   * @returns {*[]|*}
   */
  renderTable() {
    if (!this.state.lookupsLoaded || !this.state.liveTagsLoaded) {
      return <div className={'single-message info message-compact'}>Data is loading... Please be patient...</div>;
    }

    if (this.state.lookupsTotal === 0) {
      return <div className={'message-compact single-message no-content'}>No tag lookup rows to list.</div>;
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['bd_keyword_name', 'Tag To Replace'],
      [`fk_vs_tag_id_NOSORT`, 'Replacement'],
      ['created_at', 'Created On']
    ]);

    return ([
      <PaginationLayout
        key={'tag-replacement-pagination'} schema={'tag-lookups'} total={this.state.lookupsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={true}
        updateCurrentPage={this.updateCurrentPage} updatePageSize={this.updatePageSize}
      />,
      <table key={'tag-replacement-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.lookups.map(lookupRow => {
            return <TermReplacementRow
              key={lookupRow.id} lookup={lookupRow}
              listing={this.state.liveTags.find(tag => {
                return tag.id === lookupRow.vs_tag_id;
              })}
              termToReplaceRowName={'bd_keyword_name'}
              deleteRow={this.deleteTagReplacementLookup}
              runReplacement={this.runTagReplacement}
            />;
          })
        }
        </tbody>
      </table>
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
    return (
      <div className={'schema-module admin-module'}>
        <h3>Replace Tags</h3>
        <ReplaceTermsForm
          schema={'tags'} uniqueListings={this.state.uniqueTags} liveListings={this.state.liveTags}
          runReplacement={this.runTagReplacement} replaceRunning={this.state.replaceRunning}
        />
        <h4>Manage Tag Replacements</h4>
        {this.renderTable()}
      </div>
    );
  }
};
