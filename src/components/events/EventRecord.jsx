import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import '../../styles/listing-forms.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {isLoading: true, hasChanged: false};
    this.eventsService = app.service('events');

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
  }

  componentDidMount() {
    this.eventsService.get(this.props.eventId).then((message) => this.setState({'event': message, isLoading: false}));
  }

  handleChange() {
    this.refs.submitButton.disabled = false;
  }

  handleSubmit(e) {
    const newData = {
      name: this.refs.nameInput.value.trim(),
      start_date: this.refs.startInput.value,
      end_date: this.refs.endInput.value,
      description: this.refs.descInput.value.trim()
    };

    e.preventDefault();

    this.eventsService.patch(this.props.eventId, newData).then((message) => {
      this.setState({event: message});
      this.refs.submitButton.disabled = true;
    });
  }

  deleteEvent() {
    // TODO: Only administrators should be able to delete
    this.eventsService.remove(this.props.eventId).then(this.setState({hasDeleted: true}));
  }

  render() {
    if (this.state.isLoading) {
      return <p>Data loading... Please wait...</p>;
    }

    if (this.state.hasDeleted) {
      return <Redirect to={'/events'}/>
    }

    const listing = this.state.event;
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };

    const updatedReadable = listing.updated_at ? new Date(listing.updated_at).toLocaleString('en-US', dateFormatOptions) : '';
    const createdReadable = listing.created_at ? new Date(listing.created_at).toLocaleString('en-US', dateFormatOptions) : '';

    return (
      <form id="event-listing-form" onSubmit={this.handleSubmit} onChange={this.handleChange}>
        <div>
          <button type="submit" ref="submitButton" disabled>Save Changes</button>
          <button type="button" ref="deleteButton" onClick={this.deleteEvent}>Delete Event</button>
        </div>
        <label>
          ID
          <input type="text" defaultValue={listing.id} disabled/>
        </label>
        <label>
          Created at
          <input type="text" defaultValue={createdReadable} disabled/>
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedReadable} disabled/>
        </label>
        <label>
          Name
          <input type="text" ref="nameInput" defaultValue={listing.name}/>
        </label>
        <label>
          Start Date
          <input type="date" ref="startInput" defaultValue={listing.start_date}/>
        </label>
        <label>
          End Date
          <input type="date" ref="endInput" defaultValue={listing.end_date}/>
        </label>
        <label>
          Description
          <textarea ref="descInput" defaultValue={listing.description}/>
        </label>
      </form>
    );
  }
};
