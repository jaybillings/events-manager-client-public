import React from "react";
import {renderTableHeader} from "../../utilities";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";

export default class PendingVenuesModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'venues');
  }

  render() {
    const pendingVenues = this.state.pendingListings;
    const pendingVenuesCount = this.state.pendingListingsCount;
    const hoods = this.props.hoods;

    if (!(pendingVenues && hoods)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesCount === 0) {
      return <p>No pending venues to list.</p>;
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const isVisible = this.state.moduleVisible;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const sort = this.state.sort;
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>Venues</h3>
        <ShowHideToggle isVisible={isVisible} changeVisibility={this.toggleModuleVisibility}/>
        <PaginationLayout
          key={'pending-venues-pagination'} pageSize={pageSize} activePage={currentPage}
          total={pendingVenuesCount} schema={'pending-venues'}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
        />
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColumnSortSelf)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} pendingListing={venue}
                hood={hoods.find(h => {
                  return h.id === venue.hood_id
                })}
                hoods={hoods}
                saveChanges={this.saveChanges} discardListing={this.discardListing}
                listingIsDup={this.queryForSimilar}
              />)
          }
          </tbody>
        </table>
        <p>0 / {pendingVenuesCount} venues selected</p>
      </div>
    );
  }
}
