import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {friendlyDate} from '../../utilities';
import app from '../../services/socketio';

export default class NeighborhoodRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.hoodsService = app.service('neighborhoods');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteNeighborhood = this.deleteNeighborhood.bind(this);
    this.saveNeighborhood = this.saveNeighborhood.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteNeighborhood() {
    // TODO: Restrict to admins
    this.hoodsService.remove(this.props.neighborhood.id).then(message => console.log('remove', message));
  }

  saveNeighborhood() {
    const newData = {name: this.refs['nameInput'].value.trim()};

    this.hoodsService.patch(this.props.neighborhood.id, newData).then(message => console.log('patch', message));
    this.setState({editable: false});
  }

  render() {
    const neighborhood = this.props.neighborhood;
    const updatedAt = friendlyDate(neighborhood.updated_at);

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveNeighborhood}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={neighborhood.name}/>
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteNeighborhood}>Delete</button>
        </td>
        <td><Link to={`/neighborhoods/${neighborhood.id}`}>{neighborhood.name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
