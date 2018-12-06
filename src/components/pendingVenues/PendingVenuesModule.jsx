import React from "react";
import {renderTableHeader} from "../../utilities";
import app from "../../services/socketio";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

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

  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Added "${message.name}" as new pending venue`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      })
      .on('updated', message => {
        this.props.updateMessageList({status: 'info', details: message.details});
        this.fetchPendingListings();
      })
      .on('patched', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Updated pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.fetchPendingListings();
      })
      .on('removed', message => {
        this.props.updateMessageList({
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

  fetchAllData() {
    this.fetchPendingListings();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingHoods: message.data, pendingHoodsLoaded: true});
    });
  }

  renderTable() {
    const pendingVenuesCount = this.state.pendingListingsCount;

    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesCount === 0) {
      return <p>No pending venues to list.</p>;
    }

    const pendingVenues = this.state.pendingListings;
    const hoods = this.state.hoods;
    const pendingHoods = this.state.pendingHoods;
    const uniqueHoods = Array.from(new Set(hoods.concat(pendingHoods)));
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const selectedVenues = this.state.selectedListings;
    const numSchemaLabel = selectedVenues.length || "All";
    const schemaLabel = selectedVenues.length === 1 ? 'venue' : 'venues';

    return ([
      <ShowHideToggle key={'venues-module-showhide'} isVisible={isVisible}
                      changeVisibility={this.toggleModuleVisibility} />,
      <div key={'venues-module-body'}>
        <SelectionControl
          numSelected={selectedVenues.length} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-venues-pagination'} schema={'pending-venues'}
          total={pendingVenuesCount} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} pendingListing={venue} selected={selectedVenues.includes(venue.id)}
                hood={(hoods.find(h => {return h.uuid === venue.hood_uuid}))} hoods={uniqueHoods}
                saveChanges={this.saveChanges} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} onClick={this.publishListings}>Publish {numSchemaLabel} {schemaLabel}</button>
        <button type={'button'} onClick={this.discardListings}>Discard {numSchemaLabel} {schemaLabel}</button>
      </div>
    ])
  }

  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>Venues</h3>
        {this.renderTable()}
      </div>
    );
  }
}
