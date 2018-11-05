import React, {Component} from 'react';
import Moment from 'moment';
import {renderCheckboxList, renderOptionList} from '../../utilities';

import '../../styles/add-form.css';

export default class EventAddForm extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();
    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.descInput = React.createRef();
    this.ongoingInput = React.createRef();
    this.emailInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
    this.hoursInput = React.createRef();
    this.ticketUrlInput = React.createRef();
    this.ticketPhoneInput = React.createRef();
    this.ticketPricesInput = React.createRef();
    this.ongoingInput = React.createRef();
    this.venueInput = React.createRef();
    this.orgInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const eventObj = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueInput.current.value,
      org_id: this.orgInput.current.value,
      description: this.descInput.current.value.trim(),
      flag_ongoing: this.ongoingInput.current.checked
    };
    const checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    let tagsToSave = [];

    // Only include non-required if they have a value
    eventObj.email = this.emailInput.current.value.trim();
    eventObj.url = this.urlInput.current.value.trim();
    eventObj.phone = this.phoneInput.current.value.trim();
    eventObj.hours = this.hoursInput.current.value.trim();
    eventObj.ticket_url = this.ticketUrlInput.current.value.trim();
    eventObj.ticket_phone = this.ticketPhoneInput.current.value.trim();
    eventObj.ticket_prices = this.ticketPricesInput.current.value.trim();

    // Tag data
    checkedBoxes.forEach(input => {
      tagsToSave.push(input.value);
    });

    this.props.createEvent(eventObj, tagsToSave);
  }

  clearForm() {
    this.nameInput.current.value = '';
    this.descInput.current.value = '';
    this.startInput.current.valueAsDate = new Date();
    this.startInput.current.valueAsDate = new Date();
    this.venueInput.current.value = this.venueInput.current.firstChild.value;
    this.orgInput.current.value = this.orgInput.current.firstChild.value;
    document.querySelectorAll('.js-checkbox:checked').forEach(chkbx => chkbx.checked = false);
  }

  render() {
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const tags = this.props.tags;

    return (
      <form id={'event-add-form'} className={'add-form'} onSubmit={this.handleSubmit}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength="100" />
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={this.startInput} defaultValue={Moment().format('YYYY-MM-DD')} required />
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={this.endInput} defaultValue={Moment().format('YYYY-MM-DD')} required />
        </label>
        <label className={'required'}>
          Venue
          <select ref={this.venueInput}>{renderOptionList(venues)}</select>
        </label>
        <label className={'required'}>
          Organizers
          <select ref={this.orgInput}>{renderOptionList(organizers)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} required maxLength="500" />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, [])}
        </label>
        <label>
          Email Address
          <input type={'email'} ref={this.emailInput} />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} />
        </label>
        <label>
          Event Hours
          <input type={'text'} ref={this.hoursInput} />
        </label>
        <label>
          Ticketing URL
          <input type={'url'} ref={this.ticketUrlInput} />
        </label>
        <label>
          Ticketing Phone Number
          <input type={'tel'} ref={this.ticketPhoneInput} />
        </label>
        <label>
          Ticket Prices
          <input type={'text'} ref={this.ticketPricesInput} />
        </label>
        <label>
          <input type={'checkbox'} ref={this.ongoingInput} />
          Ongoing Event
        </label>
        <button type={'submit'} className={'button-primary'}>Publish Event</button>
      </form>
    );
  }
};
