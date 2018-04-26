import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {renderOptionList} from '../../utilities';
import app from '../../services/socketio';

export default class EventRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.eventsService = app.service('events');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteEvent() {
    // TODO: Only admins should be able to do this
    this.eventsService.remove(this.props.event.id).then(message => console.log('remove', message));
  }

  saveEvent() {
    console.log('in saveEvent()');
    const newData = {
      name: this.refs.nameInput.value.trim(),
      start_date: this.refs.startInput.value,
      end_date: this.refs.endInput.value,
      venue_id: this.refs.venueList.value,
      org_id: this.refs.orgList.value
    };

    this.eventsService.patch(this.props.event.id, newData).then((message) => console.log(message));
    this.setState({editable: false});
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const venueName = this.props.venue ? this.props.venue.name : 'NO VENUE';
    const orgName = this.props.organizer ? this.props.organizer.name : 'NO ORGANIZER';
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };
    const updatedReadable = new Date(event.updated_at).toLocaleString('en-US', dateFormatOptions);

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveEvent}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={event.name}/>
          </td>
          <td>
            <input type={'date'} ref={'startInput'} defaultValue={event.start_date}/>
          </td>
          <td>
            <input type={'date'} ref={'endInput'} defaultValue={event.end_date}/>
          </td>
          <td>
            <select ref={'venueList'} defaultValue={event.venue_id || ''}>{renderOptionList(venues)}</select>
          </td>
          <td>
            <select ref={'orgList'} defaultValue={event.org_id || ''}>{renderOptionList(organizers)}</select>
          </td>
          <td>{updatedReadable}</td>
        </tr>
      );
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteEvent}>Delete</button>
        </td>
        <td><Link to={`/events/${event.id}`}>{event.name}</Link></td>
        <td>{event.start_date}</td>
        <td>{event.end_date}</td>
        <td>{venueName}</td>
        <td>{orgName}</td>
        <td>{updatedReadable}</td>
      </tr>
    );
  }
};
