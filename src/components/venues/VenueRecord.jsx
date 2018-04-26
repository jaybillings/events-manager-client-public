import React, {Component} from 'react';
import app from '../../services/socketio';
import {renderOptionList, friendlyDate} from "../../utilities";

import '../../styles/schema-record.css';

export default class VenueRecord extends Component {
  constructor(props) {
    super(props);

    this.venuesService = app.service('venues');

    this.deleteVenue = this.deleteVenue.bind(this);
    this.saveVenue = this.saveVenue.bind(this);
  }

  deleteVenue() {
    const id = this.props.venue.id;
    this.venuesService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveVenue(e) {
    e.preventDefault();

    const id = this.props.venue.id;
    const newData = {
      name: this.refs.nameInput.value.trim(),
      hood_id: this.refs.hoodList.value,
      description: this.refs.descInput.value.trim()
    };

    this.venuesService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, message => {
      console.log('error', message);
    });
  }

  render() {
    const venue = this.props.venue;
    const neighborhoods = this.props.neighborhoods;
    const createdAt = friendlyDate(venue.created_at);
    const updatedAt = friendlyDate(venue.updated_at);

    return (
      <form id={'venue-listing-form'} className={'schema-record'} onSubmit={this.saveVenue}>
        <div>
          <button type={'button'} ref={'deleteButton'} onClick={this.deleteVenue}>Delete Venue</button>
          <button type={'submit'} ref={'submitBUtton'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          ID
          <input type={'text'} defaultValue={venue.id} disabled />
        </label>
        <label>
          Created at
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Updated at
          <input type={'text'} defaultValue={updatedAt} disabled />
        </label>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} defaultValue={venue.name}/>
        </label>
        <label>
          Neighborhood
          <select ref={'hoodList'} defaultValue={venue.hood_id || ''}>{renderOptionList(neighborhoods)}</select>
        </label>
        <label>
          Description
          <textarea ref={'descInput'} defaultValue={venue.description}/>
        </label>
      </form>
    );
  }
};
