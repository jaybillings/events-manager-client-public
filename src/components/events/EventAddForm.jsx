import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';
import {renderCheckboxList, renderOptionList} from '../../utilities';

import '../../styles/add-form.css';

export default class EventAddForm extends Component {
  constructor(props) {
    super(props);

    this.eventsService = app.service('events');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.createEvent = this.createEvent.bind(this);
    this.saveTags = this.saveTags.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  createEvent(e) {
    e.preventDefault();

    const eventObj = {
      name: this.refs['nameInput'].value.trim(),
      start_date: Moment(this.refs['startInput'].value).valueOf(),
      end_date: Moment(this.refs['endInput'].value).valueOf(),
      venue_id: this.refs['venueList'].value,
      org_id: this.refs['orgList'].value,
      description: this.refs['descInput'].value.trim(),
      flag_ongoing: this.refs['ongoingInput'].checked
    };

    this.eventsService.create(eventObj).then(message => {
      console.log('create', message);
      this.saveTags(message.id);
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });
  }

  saveTags(recordId) {
    let tagData = [];
    let checkedBoxes = document.querySelectorAll('.js-checkbox:checked');

    checkedBoxes.forEach(input => {
      tagData.push({'event_id': recordId, 'tag_id': input.value});
    });

    this.tagsLookupService.create(tagData).then(message => {
      console.log('created', message);
      this.clearForm();
    }, reason => console.log('error', reason));
  }

  clearForm() {
    this.refs['nameInput'].value = '';
    this.refs['descInput'].value = '';
    this.refs['startInput'].valueAsDate = new Date();
    this.refs['endInput'].valueAsDate = new Date();
    this.refs['venueList'].value = this.refs['venueList'].firstChild.value;
    this.refs['orgList'].value = this.refs['orgList'].firstChild.value;
    document.querySelectorAll('.js-checkbox:checked').forEach(chkbx => chkbx.checked = false);
  }

  render() {
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const tags = this.props.tags;

    return (
      <form id={'event-add-form'} className={'add-form'} onSubmit={this.createEvent}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength="100" />
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={'startInput'} defaultValue={Moment().format('YYYY-MM-DD')} required />
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={'endInput'} defaultValue={Moment().format('YYYY-MM-DD')} required />
        </label>
        <label className={'required'}>
          Venue
          <select ref={'venueList'}>{renderOptionList(venues)}</select>
        </label>
        <label className={'required'}>
          Organizers
          <select ref={'orgList'}>{renderOptionList(organizers)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={'descInput'} required maxLength="500" />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, [])}
        </label>
        <label>
          Email Address
          <input type={'email'} ref={'emailInput'} />
        </label>
        <label>
          URL
          <input type={'url'} ref={'urlInput'} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={'phoneInput'} />
        </label>
        <label>
          Event Hours
          <input type={'text'} ref={'hoursInput'} />
        </label>
        <label>
          Ticketing URL
          <input type={'url'} ref={'ticketUrlInput'} />
        </label>
        <label>
          Ticketing Phone Number
          <input type={'tel'} ref={'ticketPhoneInput'} />
        </label>
        <label>
          Ticket Prices
          <input type={'text'} ref={'ticketPricesInput'} />
        </label>
        <label>
          <input type={'checkbox'} ref={'ongoingInput'} />
          Ongoing Event
        </label>
        <button type={'submit'} className={'button-primary'}>Publish Event</button>
      </form>
    );
  }
};
