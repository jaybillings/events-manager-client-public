import React from "react";
import {BeatLoader} from "react-spinners";
import {displayErrorMessages, printToConsole, renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from "../../services/socketio";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

/**
 * `PendingVenuesModule` renders the pending venues data table as a module.
 *
 * @class
 * @child
 * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
 */
export default class PendingVenuesModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'venues');

    Object.assign(this.state, {
      hoods: [], hoodsLoaded: false, pendingHoods: [], pendingHoodsLoaded: false
    });

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
  }

  /**
   * `stopListening` removes data service listeners.
   */
  stopListening() {
    super.stopListening();

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
   * `listenForChanges` registers data service listeners.
   */
  listenForChanges() {
    super.listenForChanges();

    const services = new Map([
      [this.hoodsService, this.fetchHoods],
      [this.pendingHoodsService, this.fetchPendingHoods]
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
   * `createSearchQuery` creates a Common API compatible query from a search term.
   *
   * For venues, the text search matches against the name, uuid, and neighborhood name.
   *
   * @returns {Object}
   */
  createSearchQuery() {
    if (!this.state.searchTerm) return null;

    const likeClause = {$like: `%${this.state.searchTerm}%`};

    return {
      '$or': [
        {'fk_hoods.name': likeClause},
        {'pending-venues.name': likeClause},
        {'pending-venues.uuid': likeClause}
      ]
    };
  }

  /**
   * `fetchAllData` fetches data required by the component.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListings();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  /**
   * `fetchHoods` fetches published neighborhoods and saves them to the state.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({hoods: result.data, hoodsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'neighborhoods', err, this.props.updateMessagePanel, 'reload');
        this.setState({hoodsLoaded: false});
      });
  }

  /**
   * `fetchPendingHoods` fetches pending neighborhoods and saves them to the state.
   */
  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({pendingHoods: result.data, pendingHoodsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'pending neighborhoods', err, this.props.updateMessagePanel, 'reload');
        this.setState({pendingHoodsLoaded: false});
      });
  }

  /**
   * `renderTable` renders the data table.
   *
   * @override
   * @returns {*}
   */
  renderTable() {
    const pendingVenuesTotal = this.state.pendingListingsTotal;

    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) return <div
      className={'single-message info message-compact'}>Data is loading... Please be patient...</div>;
    if (pendingVenuesTotal === 0) return <div className={'message-compact single-message no-content'}>No pending venues
      to list.</div>;

    const pendingVenues = this.state.pendingListings;
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['fk_hoods.name', 'Neighborhood'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const uniqueHoods = uniqueListingsOnly(this.state.hoods, this.state.pendingHoods);
    const selectedVenues = this.state.selectedListings;
    const schemaLabel = selectedVenues.length === 1 ? 'venue' : 'venues';

    const spinnerClass = this.state.publishRunning ? ' button-with-spinner' : '';
    const publishButton = this.user.is_su ?
      <button type={'button'} className={`button-primary${spinnerClass}`} onClick={this.handlePublishButtonClick}
              disabled={selectedVenues.length === 0}>
        <BeatLoader size={8} sizeUnit={"px"} color={'#c2edfa'} loading={this.state.publishRunning} />
        Publish {selectedVenues.length || ''} {schemaLabel}
      </button> : '';

    return ([
      <ShowHideToggle
        key={'pending-venues-showhide'} isVisible={this.state.moduleVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <SelectionControl
        key={'pending-venues-selection'} numSelected={selectedVenues.length} total={this.state.pendingListingsTotal}
        schema={this.schema}
        selectPage={this.selectPageOfListings} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
      />,
      <PaginationLayout
        key={'pending-venues-pagination'} schema={'pending-venues'} includeAll={false}
        total={pendingVenuesTotal} pageSize={this.state.pageSize} activePage={this.state.currentPage}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <div key={'pending-venues-table'}>
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} schema={'pending-venues'} listing={venue}
                selected={selectedVenues.includes(venue.id)} hoods={uniqueHoods}
                hood={(uniqueHoods.find(h => {
                  return ('' + h.uuid) === ('' + venue.hood_uuid);
                }))}
                updateListing={this.updateListing} removeListing={this.removeListing}
                handleListingSelect={this.handleListingSelect} queryForDuplicate={this.queryForDuplicate}
                queryForMatching={this.queryForMatching}
              />)
          }
          </tbody>
        </table>
      </div>,
      <div key={'pending-venues-button'} className={'publish-buttons'}>
        {publishButton}
        <button type={'button'} className={'default'} onClick={this.discardListings}
                disabled={selectedVenues.length === 0}>
          Discard {selectedVenues.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }
}
