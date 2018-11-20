import React from "react";
import {renderTableHeader} from "../../utilities";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

export default class PendingVenuesModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'venues');
  }

  renderTable() {
    const pendingVenuesCount = this.state.pendingListingsCount;

    if (!(this.state.listingsLoaded && this.props.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesCount === 0) {
      return <p>No pending venues to list.</p>;
    }

    const pendingVenues = this.state.pendingListings;
    const hoods = this.props.hoods;
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

    return ([
      <ShowHideToggle
        key={'venues-module-showhide'} isVisible={isVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'venues-module-body'}>
        <SelectionControl
          numSelected={selectedVenues.length} totalCount={pendingVenues.length} schema={'venues'}
          selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-venues-pagination'} pageSize={pageSize} activePage={currentPage}
          total={pendingVenuesCount} schema={'pending-venues'}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.handleUpdateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, sort, this.handleUpdateSort)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} pendingListing={venue}
                hood={hoods.find(h => {
                  return h.id === venue.hood_id
                })}
                hoods={hoods} selected={selectedVenues.includes(venue.id)}
                saveChanges={this.saveChanges} discardListing={this.discardListing}
                listingIsDup={this.queryForSimilar} handleListingSelect={this.handleListingSelect}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} disabled={selectedVenues.length === 0} onClick={this.publishListings}>Publish Venues</button>
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
