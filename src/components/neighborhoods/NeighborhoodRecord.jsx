import React, {Component} from 'react';
import app from '../../services/socketio';
import {friendlyDate} from '../../utilities';

import '../../styles/schema-record.css';

export default class NeighborhoodRecord extends Component {
  constructor(props) {
    super(props);

    this.hoodsService = app.service('neighborhoods');
    this.state = {hasDeleted: false};

    this.deleteNeighborhood = this.deleteNeighborhood.bind(this);
    this.saveNeighborhood = this.saveNeighborhood.bind(this);
  }

  deleteNeighborhood() {
    // TODO: Restrict to admins
    const id = this.props.neighborhood.id;
    this.hoodsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveNeighborhood(e) {
    e.preventDefault();

    const id = this.props.neighborhood.id;
    const newData = {name: this.refs.nameInput.value.trim()};

    this.hoodsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, message => {
      console.log('error', message);
    });
  }

  render() {
    const neighborhood = this.props.neighborhood;
    const createdAt = friendlyDate(neighborhood.created_at);
    const updatedAt = friendlyDate(neighborhood.updated_at);

    return (
      <form id={'neighborhood-listing-form'} className={'schema-record'} onSubmit={this.saveNeighborhood}>
        <div>
          <button type={'button'} ref={'deleteButton'} onClick={this.deleteNeighborhood}>Delete Neighborhood</button>
          <button type={'submit'} ref={'submitButton'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          ID
          <input type={'text'} defaultValue={neighborhood.id} disabled />
        </label>
        <label>
          Created At
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} defaultValue={updatedAt} disabled />
        </label>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} defaultValue={neighborhood.name}/>
        </label>
      </form>
    );
  }
};
