import React from 'react';
import {renderTableHeader} from "../../utilities";

import ListingsTable from "../ListingsTable";
import EventRow from "./EventRow";
import PaginationLayout from "../common/PaginationLayout";

export default class EventsTable extends ListingsTable {
  constructor(props) {
    super(props, 'events');
  }

  render() {
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venue', 'Venue'],
      ['fk_org', 'Organizer'],
      ['updated_at', 'Last Modified'],
      ['is_published', 'Status']
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
        updatePageSize={this.handleUpdatePageSize} updateCurrentPage={this.handleUpdateCurrentPage}
      />,
      <table key={'events-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.handleUpdateSort)}</thead>
        <tbody>
        {
          events.map(event =>
            <EventRow
              key={event.id} listing={event}
              venue={venues.find(v => {
                return v.id === event.venue_id
              })}
              org={orgs.find(o => {
                return o.id === event.org_id
              })}
              venues={venues} orgs={orgs}
              saveListing={this.handleSaveChanges} deleteListing={this.handleDeleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
