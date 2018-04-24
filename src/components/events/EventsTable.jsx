import React, {Component} from 'react';
import app from '../../services/socketio';

import EventRow from './EventRow';

import '../../styles/data-tables.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.fetchEvents = this.fetchEvents.bind(this);
  }

  componentDidMount() {
    const eventsService = app.service('events');

    // Query data
    eventsService.find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then((response) => {
      this.setState({'events': response.data});
    });

    // Register listeners
    eventsService
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
    app.service('events').find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then(response => this.setState({'events': response.data}));
  }

  render() {
    let events = this.state.events || [];

    return (
      <table>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Description</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {events.map(event => <EventRow key={event.id} event={event}/>)}
        </tbody>
      </table>
    );
  }
};
