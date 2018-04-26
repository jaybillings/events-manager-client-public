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
      name: this.refs.nameInput.value.trim(),
      hood_id: this.refs.hoodList.value,
      description: this.refs.descInput.value.trim()
    };

    this.venuesService.create(venueObj).then(message => {
      console.log('create', message);
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });

    // Clear form
    this.refs.nameInput.value = '';
    this.refs.hoodList.value = '';
    this.refs.descInput.value = '';
  }

  render() {
    const neighborhoods = this.props.neighborhoods;

    return (
      <form id={'venue-add-form'} className={'add-form'} onSubmit={this.createVenue}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <label>
          Neighborhood
          <select ref={'hoodList'}>{renderOptionList(neighborhoods)}</select>
        </label>
        <label>
          Description
          <textarea ref={'descInput'} required maxLength={500} />
        </label>
        <button type={'button'}>Start Over</button>
        <button type={'submit'} className={'button-primary'}>Add Event</button>
      </form>
    );
  }
};
