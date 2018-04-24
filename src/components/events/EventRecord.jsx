import React, {Component} from 'react';
import app from '../../services/socketio';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    const eventsService = app.service('events');
    const id = parseInt(this.props.eventId, 10);

    eventsService.get(id).then((response) => {
      this.setState({'event': response})
    });
  }

  render() {
    const listing = this.state.event || {};

    return (
      <dl>
        <dt>ID</dt>
        <dd>{listing.id}</dd>
        <dt>Created On</dt>
        <dd>{listing.created_at}</dd>
        <dt>Last Updated</dt>
        <dd>{listing.updated_at}</dd>
        <dt>Name</dt>
        <dd>{listing.name}</dd>
        <dt>Start Date</dt>
        <dd>{listing.start_date}</dd>
        <dt>End Date</dt>
        <dd>{listing.end_date}</dd>
        <dt>Description</dt>
        <dd>{listing.description}</dd>
      </dl>
    );
  }
};
