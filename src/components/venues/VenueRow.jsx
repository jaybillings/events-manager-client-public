import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {renderOptionList} from "../../utilities";
import app from '../../services/socketio';

export default class VenueRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.venuesService = app.service('venues');

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
    // TODO : Lock to admins
    this.venuesService.remove(this.props.venue.id).then(message => console.log('remove', message));
  }

  saveEvent() {
    const newData = {
      name: this.refs.nameInput.value.trim(),
      hood_id: this.refs.hoodList.value
    };

    this.venuesService.patch(this.props.venue.id, newData).then(message => console.log(message));
    this.setState({editable: false});
  }

  render() {
    const venue = this.props.venue;
    const neighborhoods = this.props.neighborhoods;
    const hoodName = this.props.neighborhood ? this.props.neighborhood.name : 'NO NEIGHBORHOOD';
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };
    const updatedReadable = new Date(venue.updated_at).toLocaleString('en-US', dateFormatOptions);

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveEvent}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={venue.name} />
          </td>
          <td>
            <select ref={'hoodList'} defaultValue={venue.hood_id || ''}>{renderOptionList(neighborhoods)}</select>
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
        <td><Link to={`/venues/${venue.id}`}>{venue.name}</Link></td>
        <td>{hoodName}</td>
        <td>{updatedReadable}</td>
      </tr>
    );
  }
};
