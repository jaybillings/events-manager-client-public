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
   * @param {object} props
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
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Added "${message.name}" as new pending venue`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      })
      .on('updated', message => {
        this.props.updateMessagePanel({status: 'info', details: message.details});
        this.fetchPendingListings();
      })
      .on('patched', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Updated pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.fetchPendingListings();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Discarded pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      });

    this.hoodsService
      .on('created', () => this.fetchHoods())
      .on('updated', () => this.fetchHoods())
      .on('patched', () => this.fetchHoods())
      .on('removed', () => this.fetchHoods());

    this.pendingHoodsService
      .on('created', () => this.fetchPendingHoods())
      .on('updated', () => this.fetchPendingHoods())
      .on('patched', () => this.fetchPendingHoods())
      .on('removed', () => this.fetchPendingHoods());
  }

  /**
   * Runs before the component unmounts. Removes data service listeners.
   * @override
   */
  componentWillUnmount() {
    const services = [
      this.pendingListingsService,
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
   * Fetches all data for the page.
   * @override
   */
  fetchAllData() {
    this.fetchPendingListings();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  /**
   * Fetches published neighborhoods.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  /**
   * Fetches pending neighborhoods.
   */
  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingHoods: message.data, pendingHoodsLoaded: true});
    });
  }

  /**
   * Renders the table of listings.
   * @override
   * @returns {*}
   */
  renderTable() {
    const pendingVenuesTotal = this.state.pendingListingsTotal;

    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesTotal === 0) {
      return <p>No pending venues to list.</p>;
    }

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
        key={'venues-module-showhide'} isVisible={this.state.moduleVisible} changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'venues-module-body'}>
        <SelectionControl
          numSelected={selectedVenues.length} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
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
                key={`venue-${venue.id}`} listing={venue} selected={selectedVenues.includes(venue.id)}
                hood={(uniqueHoods.find(h => {
                  return h.uuid === venue.hood_uuid
                }))} hoods={uniqueHoods}
                updateListing={this.saveChanges} removeListing={this.removePendingListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        {publishButton}
        <button type={'button'} onClick={this.discardListings} disabled={selectedVenues.length === 0}>
          Discard {selectedVenues.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }
}
