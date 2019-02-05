import React from 'react';
import Moment from 'moment';
import {renderCheckboxList, renderOptionList} from '../../utilities';

import ListingAddForm from "../ListingAddForm";

/**
 * EventAddForm is a component which displays a form for adding new events.
 * @class
 * @child
 */
export default class EventAddForm extends ListingAddForm {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

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
    this.venueList = React.createRef();
    this.orgList = React.createRef();
  }

  /**
   * Compiles the data required for creating a new listing from the form fields.
   * @override
   *
   * @returns {{tagsToSave: Array, eventObj: {end_date: number, venue_uuid: *, name: *, description: *, org_uuid: *, start_date: number, flag_ongoing: *}}}
   */
  buildNewListing() {
    const eventObj = {
      name: this.nameInput.current.value,
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_uuid: this.venueList.current.value,
      org_uuid: this.orgList.current.value,
      description: this.descInput.current.value,
      flag_ongoing: this.ongoingInput.current.checked
    };

    // Optional data
    this.emailInput.current.value !== '' && (eventObj.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (eventObj.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (eventObj.phone = this.phoneInput.current.value);
    this.hoursInput.current.value !== '' && (eventObj.hours = this.hoursInput.current.value);
    this.ticketUrlInput.current.value !== '' && (eventObj.ticket_url = this.ticketUrlInput.current.value);
    this.ticketPhoneInput.current.value !== '' && (eventObj.ticket_phone = this.ticketPhoneInput.current.value);
    this.ticketPricesInput.current.value !== '' && (eventObj.ticket_prices = this.ticketPricesInput.current.value);

    // Tag data
    const checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    let tagsToSave = [];

    checkedBoxes.forEach(input => {
      tagsToSave.push(input.value);
    });

    return {eventObj: eventObj, tagsToSave: tagsToSave};
  }

  /**
   * Clears the form by setting all values to a default or empty value.
   * @override
   */
  clearForm() {
    this.nameInput.current.value = '';
    this.startInput.current.valueAsDate = new Date();
    this.endInput.current.valueAsDate = new Date();
    this.venueList.current.value = this.venueList.current.firstChild.value;
    this.orgList.current.value = this.orgList.current.firstChild.value;
    this.descInput.current.value = '';
    this.ongoingInput.current.checked = false;
    this.emailInput.current.value = '';
    this.urlInput.current.value = '';
    this.phoneInput.current.value = '';
    this.hoursInput.current.value = '';
    this.ticketUrlInput.current.value = '';
    this.ticketPhoneInput.current.value = '';
    this.ticketPricesInput.current.value = '';
    document.querySelectorAll('.js-checkbox:checked').forEach(checkbox => checkbox.checked = false);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const currentDate = Moment().format('YYYY-MM-DD');
    const submitAction = this.user.is_admin ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_admin ? 'Publish Event': 'Add Pending Event';

    return (
      <form id={'event-add-form'} className={'add-form'} onSubmit={submitAction}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={this.startInput} defaultValue={currentDate} required />
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={this.endInput} defaultValue={currentDate} required />
        </label>
        <label className={'required'}>
          Venue
          <select ref={this.venueList}
                  defaultValue={this.props.venues[0].id}>{renderOptionList(this.props.venues)}</select>
        </label>
        <label className={'required'}>
          Organizers
          <select ref={this.orgList}>{renderOptionList(this.props.orgs)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} required maxLength={500} />
        </label>
        <label>
          Tags
          {renderCheckboxList(this.props.tags, [])}
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
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
