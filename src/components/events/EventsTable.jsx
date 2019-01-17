import React from 'react';
import {renderTableHeader} from "../../utilities";

import ListingsTable from "../ListingsTable";
import EventRow from "./EventRow";
import PaginationLayout from "../common/PaginationLayout";

/**
 * EventsTable is a component that displays a table representing a collection of events, and that table's controls.
 * @note This is a stateless module that should only render. Data manipulation should occur in the EventsRow class
 * and display should occur in the EventsLayout class.
 * @class
 * @child
 */
export default class EventsTable extends ListingsTable {
  /**
   * Renders the component.
   * @returns {*[]}
   */
  render() {
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venue', 'Venue'],
      ['fk_org', 'Organizer'],
      ['updated_at', 'Last Modified'],
      ['is_published_NOSORT', 'Status']
    ]);

    const events = this.props.listings;
    const venues = this.props.venues;
    const orgs = this.props.orgs;

    const pageSize = this.props.pageSize;
    const currentPage = this.props.currentPage;
    const eventsTotal = this.props.listingsTotal;
    const sort = this.props.sort;

    return ([
      <PaginationLayout
        key={'events-pagination'} schema={'events'} total={eventsTotal} pageSize={pageSize} activePage={currentPage}
        updatePageSize={this.props.updatePageSize} updateCurrentPage={this.props.updateCurrentPage}
      />,
      <table key={'events-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.props.updateColumnSort)}</thead>
        <tbody>
        {
          events.map(event =>
            <EventRow
              key={event.uuid} listing={event} venues={venues} orgs={orgs}
              venue={venues.find(v => {return v.id === event.venue_id})}
              org={orgs.find(o => {return o.id === event.org_id})}
              updateListing={this.props.updateListing} deleteListing={this.props.deleteListing}
              checkForLive={this.props.checkForLive}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
