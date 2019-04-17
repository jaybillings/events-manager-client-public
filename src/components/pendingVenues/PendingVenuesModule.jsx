import React from "react";
import {renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from "../../services/socketio";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

/**
 * PendingVenuesModule is a component which displays pending venues as a module within a layout.
 * @class
 * @child
 */
export default class PendingVenuesModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
   */
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
   * Runs once the component is mounted. Fetches all data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.hoodsService, this.fetchHoods],
      [this.pendingHoodsService, this.fetchPendingHoods]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher())
        .on('status', message => {
          if (message.status === 'success') dataFetcher();
        });
    }
  }

  /**
   * Runs before the component unmounts. Removes data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    const services = [
      this.hoodsService,
      this.pendingHoodsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed')
        .removeAllListeners('status');
    });
  }

  /**
   * Fetches all data for the page.
   * @override
   */
  fetchAllData() {
    this.fetchListings();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  /**
   * Fetches published neighborhoods.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery, paginate: false}).then(result => {
      this.setState({hoods: result.data, hoodsLoaded: true});
    });
  }

  /**
   * Fetches pending neighborhoods.
   */
  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery, paginate: false}).then(result => {
      this.setState({pendingHoods: result.data, pendingHoodsLoaded: true});
    });
  }

  /**
   * Renders the table of listings.
   * @override
   * @returns {*}
   */
  renderTable() {
    const pendingVenuesTotal = this.state.pendingListingsTotal;

    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) return <p>Data is loading... Please be patient...</p>;
    if (pendingVenuesTotal === 0) return <p>No pending venues to list.</p>;

    const pendingVenues = this.state.pendingListings;
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const uniqueHoods = uniqueListingsOnly(this.state.hoods, this.state.pendingHoods);
    const selectedVenues = this.state.selectedListings;
    const schemaLabel = selectedVenues.length === 1 ? 'venue' : 'venues';
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary'} onClick={this.publishListings}
              disabled={selectedVenues.length === 0}>
        Publish {selectedVenues.length || ''} {schemaLabel}
      </button> : '';

    return ([
      <ShowHideToggle
        key={'venues-module-showhide'} isVisible={this.state.moduleVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'venues-module-body'}>
        <SelectionControl
          numSelected={selectedVenues.length} total={this.state.pendingListingsTotal} schema={this.schema}
          selectPage={this.selectPageOfListings} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-venues-pagination'} schema={'pending-venues'}
          total={pendingVenuesTotal} pageSize={this.state.pageSize} activePage={this.state.currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} schema={'pending-venues'} listing={venue}
                selected={selectedVenues.includes(venue.id)} hoods={uniqueHoods}
                hood={(uniqueHoods.find(h => {
                  // eslint-disable-next-line
                  return ('' + h.uuid) == ('' + venue.hood_uuid);
                }))}
                updateListing={this.updateListing} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <div className={'publish-buttons'}>
          {publishButton}
          <button type={'button'} className={'default'} onClick={this.discardListings} disabled={selectedVenues.length === 0}>
            Discard {selectedVenues.length || ''} {schemaLabel}
          </button>
        </div>
      </div>
    ])
  }
}
