import React, {Component} from 'react';
import '../../styles/data-tables.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.renderRows = this.renderRows.bind(this);
  }

  renderRows() {
    let eventsData = this.props.events !== undefined ? this.props.events.data : [];

    return eventsData.map((event) => {
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
