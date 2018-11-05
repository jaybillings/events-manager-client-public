import React, {Component} from 'react';
import {renderTableHeader} from '../../utilities';

import EventRow from './EventRow';
import PaginationLayout from "../common/PaginationLayout";

import '../../styles/schema-table.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleDeleteListing = this.handleDeleteListing.bind(this);
    this.handlePageSizeUpdate = this.handlePageSizeUpdate.bind(this);
    this.handlePageNumUpdate = this.handlePageNumUpdate.bind(this);
  }

  handleDeleteListing(id) {
    this.props.deleteEvent(id);
  }

  handleSaveChanges(id, newData) {
    this.props.saveEvent(id, newData);
  }

  handlePageSizeUpdate(e) {
    this.props.updatePageSize(e);
  }

  handlePageNumUpdate(page) {
    this.props.updateCurrentPage(page);
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

    const events = this.props.events;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const pageSize = this.props.pageSize;
    const currentPage = this.props.currentPage;
    const eventsTotal = this.props.eventsTotal;
    const columnSort = this.props.sort;

    return ([
      <PaginationLayout
        key={'events-pagination'} pageSize={pageSize} activePage={currentPage} total={eventsTotal} schema={'events'}
        updatePageSize={this.handlePageSizeUpdate} updateCurrentPage={this.handlePageNumUpdate}
      />,
      <table key={'events-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, this.props.handleColumnClick)}</thead>
        <tbody>
        {
          events.map(event =>
            <EventRow
              key={event.id} event={event}
              venue={venues.find(v => {
                return v.id === event.venue_id
              })}
              organizer={organizers.find(o => {
                return o.id === event.org_id
              })}
              venues={venues} organizers={organizers}
              saveChanges={this.handleSaveChanges} deleteListing={this.handleDeleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
