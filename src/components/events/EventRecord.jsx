import React, {Component} from 'react';
import app from '../../services/socketio';
import {renderOptionList, friendlyDate} from '../../utilities';

import '../../styles/schema-record.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.eventsService = app.service('events');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
  }

  deleteEvent() {
    // TODO: Only administrators should be able to delete
    const id = this.props.event.id;
    this.eventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveEvent(e) {
    e.preventDefault();

    const id = this.props.event.id;
    const newData = {
      name: this.refs.nameInput.value.trim(),
      start_date: this.refs.startInput.value,
      end_date: this.refs.endInput.value,
      venue_id: this.refs.venueList.value,
      org_id: this.refs.orgList.value,
      description: this.refs.descInput.value.trim()
    };

    this.eventsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, message => {
      console.log('error', message);
    });
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const createdAt = friendlyDate(event.created_at);
    const updatedAt = friendlyDate(event.updated_at);

    return (
      <form id="event-listing-form" className={'schema-record'} onSubmit={this.saveEvent}>
        <div>
          <button type="button" ref="deleteButton" onClick={this.deleteEvent}>Delete Event</button>
          <button type="submit" ref="submitButton" className="button-primary">Save Changes</button>
        </div>
        <label>
          ID
          <input type="text" defaultValue={event.id} disabled/>
        </label>
        <label>
          Created at
          <input type="text" defaultValue={createdAt} disabled/>
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedAt} disabled/>
        </label>
        <label>
          Name
          <input type="text" ref="nameInput" defaultValue={event.name}/>
        </label>
        <label>
          Start Date
          <input type="date" ref="startInput" defaultValue={event.start_date}/>
        </label>
        <label>
          End Date
          <input type="date" ref="endInput" defaultValue={event.end_date}/>
        </label>
        <label>
          Venue
          <select ref="venueList" defaultValue={event.venue_id || ''}>{renderOptionList(venues)}</select>
        </label>
        <label>
          Organizer
          <select ref="orgList" defaultValue={event.org_id || ''}>{renderOptionList(organizers)}</select>
        </label>
        <label>
          Description
          <textarea ref="descInput" defaultValue={event.description}/>
        </label>
      </form>
    );
  }
};
