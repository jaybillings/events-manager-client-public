import React from "react";
import {renderTableHeader} from "../../utilities";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";

export default class PendingEventsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'events');
  }

  render() {
    const pendingEvents = this.state.pendingListings;
    const pendingEventsCount = this.state.pendingListingsCount;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;

    if (!(pendingEvents && venues && orgs && tags)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingEventsCount === 0) {
      return <p>No pending events to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['venue_id', 'Venue'],
      ['org_id', 'Organizer'],
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
        <h3>Events</h3>
        <ShowHideToggle isVisible={isVisible} changeVisibility={this.toggleModuleVisibility} />
        <div>
          <PaginationLayout
            key={'pending-events-pagination'} schema={'pending-events'}
            total={pendingEventsCount} pageSize={pageSize} activePage={currentPage}
            updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          />
          <table className={'schema-table'} key={'pending-events-table'}>
            <thead>{renderTableHeader(titleMap, sort, this.updateColumnSortSelf)}</thead>
            <tbody>
            {
              pendingEvents.map(event =>
                <PendingEventRow
                  key={`event-${event.id}`} pendingListing={event}
                  venue={venues.find(v => {
                    return v.id === event.venue_id
                  })}
                  org={orgs.find(o => {
                    return o.id === event.org_id
                  })}
                  venues={venues} orgs={orgs}
                  saveChanges={this.saveChanges} discardListing={this.discardListing}
                  listingIsDup={this.queryForSimilar}
                />)
            }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};
