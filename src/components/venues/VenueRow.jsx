import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList,} from "../../utilities";
import app from '../../services/socketio';

export default class VenueRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.venuesService = app.service('venues');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.saveVenue = this.saveVenue.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteVenue() {
    // TODO : Lock to admins
    this.venuesService.remove(this.props.venue.id).then(message => console.log('remove', message));
  }

  saveVenue() {
    const newData = {
      name: this.refs['nameInput'].value.trim(),
      hood_id: this.refs['hoodList'].value
    };

    this.venuesService.patch(this.props.venue.id, newData).then(message => console.log(message));
    this.setState({editable: false});
  }

  render() {
    const venue = this.props.venue;
    const neighborhoods = this.props.neighborhoods;
    const hoodNameLink = this.props.neighborhood ? <Link to={`/neighborhoods/${venue.hood_id}`}>{ this.props.neighborhood.name }</Link> : 'NO NEIGHBORHOOD';
    const updatedAt = Moment(venue['updated_at']).calendar();

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveVenue}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={venue.name} />
          </td>
          <td>
            <select ref={'hoodList'} defaultValue={venue.hood_id || ''}>{renderOptionList(neighborhoods)}</select>
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteVenue}>Delete</button>
        </td>
        <td><Link to={`/venues/${venue.id}`}>{venue.name}</Link></td>
        <td>{hoodNameLink}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
