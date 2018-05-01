import React, {Component} from 'react';
import app from '../../services/socketio';
import {renderOptionList} from '../../utilities';

import '../../styles/add-form.css';

export default class VenueAddForm extends Component {
  constructor(props) {
    super(props);

    this.venuesService = app.service('venues');

    this.createVenue = this.createVenue.bind(this);
  }

  createVenue(e) {
    e.preventDefault();

    const venueObj = {
      name: this.refs['nameInput'].value.trim(),
      hood_id: this.refs['hoodList'].value,
      description: this.refs['descInput'].value.trim()
    };

    // Only add non-required if they have a value
    this.refs['emailInput'].value && (venueObj['email'] = this.refs['emailInput'].value);
    this.refs['urlInput'].value && (venueObj['url'] = this.refs['urlInput'].value);
    this.refs['phoneInput'].value && (venueObj['phone'] = this.refs['phoneInput'].value);
    this.refs['streetInput'].value && (venueObj['address_street'] = this.refs['streetInput'].value);
    this.refs['cityInput'].value && (venueObj['address_city'] = this.refs['cityInput'].value);
    this.refs['stateInput'].value && (venueObj['address_state'] = this.refs['stateInput'].value);
    this.refs['zipInput'].value && (venueObj['address_zip'] = this.refs['zipInput'].value);

    this.venuesService.create(venueObj).then(message => {
      console.log('create', message);
      document.querySelector('#venue-add-form').reset();
    }, reason => {
      console.log('error', JSON.stringify(reason));
    });
  }

  render() {
    const neighborhoods = this.props.neighborhoods;

    return (
      <form id={'venue-add-form'} className={'add-form'} onSubmit={this.createVenue}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={'hoodList'} defaultValue={this.props.neighborhoods[0].id}>{renderOptionList(neighborhoods)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={'descInput'} required maxLength={500} />
        </label>
        <label>
          Email
          <input type={'email'} ref={'emailInput'} />
        </label>
        <label>
          Url
          <input type={'url'} ref={'urlInput'} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={'phoneInput'} />
        </label>
        <label>
          Street Adress
          <input type={'text'} ref={'streetInput'} />
        </label>
        <label>
          City
          <input type={'text'} ref={'cityInput'} />
        </label>
        <label>
          State
          <input type={'text'} ref={'stateInput'} defaultValue={'Washington'} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={'zipInput'} />
        </label>
        <button type={'submit'} className={'button-primary'}>Add Venue</button>
      </form>
    );
  }
};
