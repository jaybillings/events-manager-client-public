import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';
import {renderOptionList} from "../../utilities";

import '../../styles/schema-record.css';

export default class VenueRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false};
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
      name: this.refs['nameInput'].value.trim(),
      hood_id: this.refs['hoodList'].value,
      description: this.refs['descInput'].value.trim()
    };

    // Only add non-required if they have a value
    this.refs['emailInput'].value && (newData['email'] = this.refs['emailInput'].value);
    this.refs['urlInput'].value && (newData['url'] = this.refs['urlInput'].value);
    this.refs['phoneInput'].value && (newData['phone'] = this.refs['phoneInput'].value);
    this.refs['streetInput'].value && (newData['address_street'] = this.refs['streetInput'].value);
    this.refs['cityInput'].value && (newData['address_city'] = this.refs['cityInput'].value);
    this.refs['stateInput'].value && (newData['address_state'] = this.refs['stateInput'].value);
    this.refs['zipInput'].value && (newData['address_zip'] = this.refs['zipInput'].value);

    this.venuesService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, reason => {
      console.log('error', JSON.stringify(reason));
    });
  }

  render() {
    const venue = this.props.venue;
    const neighborhoods = this.props.neighborhoods;
    const createdAt = Moment(venue['created_at']).calendar();
    const updatedAt = Moment(venue['updated_at']).calendar();

    return (
      <form id={'venue-listing-form'} className={'schema-record'} onSubmit={this.saveVenue}>
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
          <input type={'text'} ref={'nameInput'} defaultValue={venue.name} required/>
        </label>
        <label>
          Neighborhood
          <select ref={'hoodList'} defaultValue={venue.hood_id || ''} required>{renderOptionList(neighborhoods)}</select>
        </label>
        <label>
          Description
          <textarea ref={'descInput'} defaultValue={venue.description} required />
        </label>
        <label>
          Email
          <input type={'email'} ref={'emailInput'} defaultValue={venue.email} />
        </label>
        <label>
          Url
          <input type={'url'} ref={'urlInput'} defaultValue={venue.url} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={'phoneInput'} defaultValue={venue.phone} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={'streetInput'} defaultValue={venue.address_street} />
        </label>
        <label>
          City
          <input type={'text'} ref={'cityInput'} defaultValue={venue.address_city} />
        </label>
        <label>
          State
          <input type={'text'} ref={'stateInput'} defaultValue={venue.address_state} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={'zipInput'} defaultValue={venue.address_zip} />
        </label>
        <div>
          <button type={'button'} ref={'deleteButton'} onClick={this.deleteVenue}>Delete Venue</button>
          <button type={'submit'} ref={'submitBUtton'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
