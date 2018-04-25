import React, {Component} from 'react';
import app from '../../services/socketio';

import EventRow from './EventRow';

import '../../styles/data-tables.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {events: [], venues: [], organizers: []};
    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');

    this.fetchEvents = this.fetchEvents.bind(this);
    this.fetchOtherSchema = this.fetchOtherSchema.bind(this);
  }

  componentDidMount() {
    // Query data
    this.fetchEvents();

    // Register listeners
    this.eventsService
      .on('created', (message) => {
        console.log('added', message);
        this.fetchEvents();
      })
      .on('patched', (message) => {
        console.log('patched', message);
        this.fetchEvents();
      })
      .on('removed', (message) => {
        console.log('deleted', message);
        this.fetchEvents();
      });
  }

  fetchEvents() {
    // TODO: Is there a better way to update?
    this.eventsService.find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then(response => {
      this.setState({'events': response.data});
      this.fetchOtherSchema();
    });
  }

  fetchOtherSchema() {
    this.venuesService.find({query: { $sort: { name: 1}}}).then(message => {this.setState({'venues': message.data})});
    this.orgsSerivce.find({query: { $sort: { name: 1}}}).then(message => this.setState({'organizers': message.data}));
  }

  render() {
    let events = this.state.events;
    let venues = this.state.venues;
    let organizers = this.state.organizers;

    return (
      <table>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Venue</th>
          <th>Organizer</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {
          events.map(event =>
            <EventRow key={event.id}
                      event={event}
                      venue={venues.find(v => { return v.id === event.venue_id })}
                      organizer={organizers.find(o => {return o.id === event.org_id })}
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
