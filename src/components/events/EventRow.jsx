import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

export default class EventRow extends Component {
  constructor(props) {
    super(props);

    this.state = { editable: false };
    this.eventsSerivce = app.service('events');

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
    this.eventsSerivce.remove(this.props.event.id).then((message) => console.log(message));
  }

  saveEvent() {
    const newData = {
      name: this.refs.nameInput.value.trim() || this.props.event.name,
      start_date: this.refs.startInput.value || this.props.event.start_date,
      end_date: this.refs.endInput.value || this.props.event.end_date,
      description: this.refs.descInput.value.trim() || this.props.event.description
    };

    this.eventsSerivce.patch(this.props.event.id, newData).then((message) => console.log(message));
    this.setState({editable: false});
  }

  render() {
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };
    const updatedReadable = new Date(this.props.event.updated_at).toLocaleString('en-US', dateFormatOptions);

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveEvent}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={this.props.event.name} />
          </td>
          <td>
            <input type={'date'} ref={'startInput'} defaultValue={this.props.event.start_date} />
          </td>
          <td>
            <input type={'date'} ref={'endInput'} defaultValue={this.props.event.end_date} />
          </td>
          <td>
            <input type={'text'} ref={'descInput'} defaultValue={this.props.event.description} />
          </td>
          <td>{updatedReadable}</td>
        </tr>
      )
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteEvent}>Delete</button>
        </td>
        <td><Link to={`/events/${this.props.event.id}`}>{this.props.event.name}</Link></td>
        <td>{this.props.event.start_date}</td>
        <td>{this.props.event.end_date}</td>
        <td>{this.props.event.description}</td>
        <td>{updatedReadable}</td>
      </tr>
    );
  }
};
