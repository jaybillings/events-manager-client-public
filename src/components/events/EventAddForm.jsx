import React, {Component} from 'react';
import app from '../../services/socketio';
import {renderOptionList} from '../../utilities';

import '../../styles/add-form.css';

export default class EventAddForm extends Component {
  constructor(props) {
    super(props);

    this.eventsService = app.service('events');

    this.createEvent = this.createEvent.bind(this);
  }

  componentDidMount() {
    // Set date picker's default
    this.refs.startInput.valueAsDate = new Date();
    this.refs.endInput.valueAsDate = new Date();
  }

  createEvent(e) {
    e.preventDefault();

    const eventObj = {
      name: this.refs.nameInput.value.trim(),
      start_date: this.refs.startInput.value.trim(),
      end_date: this.refs.endInput.value.trim(),
      venue_id: this.refs.venueList.value,
      org_id: this.refs.orgList.value,
      description: this.refs.descInput.value.trim()
    };

    this.eventsService.create(eventObj).then(message => {
      console.log('create', message);
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });

    // Clear form
    this.refs.nameInput.value = '';
    this.refs.descInput.value = '';
    this.refs.startInput.valueAsDate = new Date();
    this.refs.endInput.valueAsDate = new Date();
    this.refs.venueList.value = '';
    this.refs.orgList.value = '';
  }

  render() {
    const venues = this.props.venues;
    const organizers = this.props.organizers;

    return (
      <form id={'event-add-form'} className={'add-form'} onSubmit={this.createEvent}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength="100"/>
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={'startInput'} required/>
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={'endInput'} required/>
        </label>
        <label>
          Venue
          <select ref={'venueList'}>{renderOptionList(venues)}</select>
        </label>
        <label>
          Organizers
          <select ref={'orgList'}>{renderOptionList(organizers)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={'descInput'} required maxLength="500"/>
        </label>
        <button type={'button'}>Start Over</button>
        <button type={'submit'} className={'button-primary'}>Add Event</button>
      </form>
    );
  }
};
