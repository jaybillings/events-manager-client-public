import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

export default class OrganizerRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.orgsService = app.service('organizers');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteOrganizer = this.deleteOrganizer.bind(this);
    this.saveOrganizer = this.saveOrganizer.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteOrganizer() {
    // TODO: Restrict to admins
    this.orgsService.remove(this.props.organizer.id).then(message => console.log('remove', message));
  }

  saveOrganizer() {
    const newData = {name: this.refs['nameInput'].value.trim()};

    this.orgsService.patch(this.props.organizer.id, newData).then(message => console.log('patch', message));
    this.setState({editable: false});
  }

  render() {
    const organizer = this.props.organizer;
    const updatedAt = Moment(organizer['updated_at']).calendar();

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveOrganizer}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={organizer.name}/>
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteOrganizer}>Delete</button>
        </td>
        <td><Link to={`/organizers/${organizer.id}`}>{organizer.name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
