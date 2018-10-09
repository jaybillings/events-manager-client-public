import React, {Component} from 'react';
import {renderTableHeader} from '../../utilities';

import PendingEventRow from './PendingEventRow';

import '../../styles/schema-table.css';

export default class PendingEventsTable extends Component {
  render() {
    const pendingEvents = this.props.pendingEvents;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const columnSort = this.props.sort;
    const clickHandler = this.props.handleColumnClick;
    const titleMap = new Map([
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['venue_id', 'Venue'],
      ['org_id', 'Organizer'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingEvents.map(event =>
            <PendingEventRow key={`event-${event.id}`} pendingEvent={event}
                             venue={venues.find(v => {
                               return v.id === event.venue_id
                             })}
                             organizer={organizers.find(o => {
                               return o.id === event.org_id
                             })}
                             venues={venues} organizers={organizers} />
          )
        }
        </tbody>
      </table>
    );
  }
};
