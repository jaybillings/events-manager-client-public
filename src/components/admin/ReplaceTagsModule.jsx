import React, {Component} from 'react';
import app from '../../services/socketio';
import {
  arrayUnique,
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  renderTableHeader,
  uniqueListingsOnly
} from "../../utilities";

import ReplaceTermsForm from './ReplaceTermsForm';
import PaginationLayout from "../common/PaginationLayout";
import TermReplacementRow from "./TermReplacementRow";

export default class ReplaceTagsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 1000};
    this.defaultSort = ['created_at', 1];

    this.state = {
      liveTags: [], pendingTags: [], uniqueTags: [], liveTagsLoaded: false, liveTagTotal: 0,
      lookups: [], lookupsTotal: 0, lookupsLoaded: false,
      sort: this.defaultSort, currentPage: 1, pageSize: this.props.defaultPageSize
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

  fetchAllData() {
    this.fetchReplacementLookups();

    Promise
      .all([
        this.fetchTags(),
        this.fetchPendingTags()
      ])
      .then(([liveTagResult, pendingTagResult]) => {
        const uniqueTags = uniqueListingsOnly(liveTagResult.data, pendingTagResult.data);
        this.setState({liveTags: liveTagResult.data, pendingTags: pendingTagResult.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'tag data', err, this.props.updateMessagePanel, 'reload');
      });
  }

  fetchTags() {
    return this.tagsService
      .find({query: this.defaultQuery})
      .then(results => {
        this.setState({liveTagsLoaded: true});
        return results;
      });
  }

  fetchPendingTags() {
    return this.pendingTagsService.find({query: this.defaultQuery});
  }

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
      .catch(errors => {
        displayErrorMessages('fetch', 'tag replacement data', errors,
          this.props.updateMessagePanel, 'retry');
        this.setState({lookupsLoaded: false});
      });
  }

  fetchLiveAndUpdateUnique() {
    this.fetchTags()
      .then(result => {
        const uniqueTags = uniqueListingsOnly(result.data, this.state.pendingTags);
        this.setState({liveTags: result.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'live tags', err, this.props.updateMessagePanel);
      });
  }

  fetchPendingAndUpdateUnique() {
    this.fetchPendingTags()
      .then(result => {
        const uniqueTags = uniqueListingsOnly(this.state.liveTags, result.data);
        this.setState({pendingTags: result.data, uniqueTags});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending tags', err, this.props.updateMessagePanel);
      });
  }

  static fetchTagsToReplace(nameToReplace, service) {
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

  createTagReplacementLookup(targetName, replacement) {
    return this.vsBdTagLookupService.create({
      bd_keyword_name: targetName,
      vs_tag_uuid: replacement.uuid,
      vs_tag_id: replacement.id
    });
  }

  replaceEventTagMappings(uuidsToReplace, uuidOfReplacement, service) {
    return this.service
      .remove(null, {query: {tag_uuid: {$in: uuidsToReplace}}})
      .then(result => {
        return Promise.all(result.map(lookupRow => {
          return this.service.create({event_uuid: lookupRow.event_uuid, tag_uuid: uuidOfReplacement})
        }))
      });
  }

  deleteTagReplacementLookup(rowID) {
    this.vsBdTagLookupService
      .remove(rowID)
      .catch(errors => {
        displayErrorMessages('delete', `tag lookup row #${rowID}`,
          errors, this.props.updateMessagePanel, 'retry');
        this.fetchReplacementLookups();
      })
  }

  static deleteOldTags(uuidsToRemove, service) {
    return service.remove(null, {query: {uuid: {$in: uuidsToRemove}}});
  }

  /**
   *
   * @param {String} nameToReplace
   * @param {String} uuidOfReplacement
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
      });
  }

  renderTable() {
    if (!this.state.lookupsLoaded || !this.state.liveTagsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    if (this.state.lookupsTotal === 0) {
      return <p>No tag lookup rows to list.</p>;
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

  render() {
    return (
      <div className={'schema-module admin-module'}>
        <h3>Replace Tags</h3>
        <ReplaceTermsForm
          schema={'tags'} uniqueListings={this.state.uniqueTags} liveListings={this.state.liveTags}
          runTagReplacement={this.runTagReplacement}
        />
        <h4>Manage Tag Replacements</h4>
        {this.renderTable()}
      </div>
    );
  }
};
