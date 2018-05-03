import React, {Component} from 'react';

import EventRow from './EventRow';

import '../../styles/schema-table.css';
import '../../styles/pagination.css';

export default class EventsTable extends Component {
  render() {
    const events = this.props.events;
    const venues = this.props.venues;
    const organizers = this.props.organizers;

    return (
      <table className={'schema-table'}>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Venue</th>
          <th>Organizer</th>
          <th>Status</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {
          events.map(event =>
            <EventRow key={event.id}
                      event={event}
                      venue={venues.find(v => {
                        return v.id === event.venue_id
                      })}
                      organizer={organizers.find(o => {
                        return o.id === event.org_id
                      })}
                      venues={venues}
                      organizers={organizers}
            />
          )
        }
        </tbody>
      </table>
    );
  }
};
