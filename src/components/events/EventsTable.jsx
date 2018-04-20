import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/data-tables.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.renderRows = this.renderRows.bind(this);
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
      console.log(response.data);
      this.setState({'events': response.data});
    });

    // Register listeners
    eventsService.on('created', (message) => {
      console.log(this.state);
      this.setState((prevState) => ({
        events: prevState.events.concat(message)
      }));
      console.log(this.state);
    });
  }

  renderRows() {
    let events = this.state.events || [];
    console.log('events', events);
    return events.map((event) => {
      return (
        <tr key={event.id}>
          <td>{event.name}</td>
          <td>{event.description}</td>
          <td>{event.start_date}</td>
          <td>{event.end_date}</td>
          <td>{event.updated_at}</td>
        </tr>
      )
    });
  }

  render() {
    return (
      <table>
        <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Modified</th>
        </tr>
        </thead>
        <tbody>
        {this.renderRows()}
        </tbody>
      </table>
    );
  }
};
