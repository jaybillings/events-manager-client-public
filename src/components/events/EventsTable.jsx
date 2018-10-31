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
  }

  handleDeleteListing(id) {
    this.props.deleteEvent(id).then(message => console.log('deleted', message));
  }

  handleSaveChanges(id, newData) {
    this.props.saveEvent(id, newData).then(message => console.log('patched', message));
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
    const handleColClick = this.props.handleColumnClick;

    return ([
      <PaginationLayout
        key={'events-pagination'} pageSize={pageSize} activePage={currentPage} total={eventsTotal}
        schema={'events'}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <table key={'events-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, handleColClick)}</thead>
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
