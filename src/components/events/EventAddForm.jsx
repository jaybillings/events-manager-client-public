import React from 'react';
import Moment from 'moment';
import {renderCheckboxList, renderOptionList} from '../../utilities';

import ListingAddForm from "../ListingAddForm";

/**
 * `EventAddForm` displays a form for adding new events.
 *
 * @class
 * @child
 * @param {{schema: String, venues: Array, orgs: Array, tags: Array, createListing: Function, createPendingListing: Function}} props
 */
export default class EventAddForm extends ListingAddForm {
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
   * `buildNewListing` compiles data for creating a new listing.
   *
   * @override
   * @returns {*}
   */
  buildNewListing() {
    const eventObj = {
      name: this.nameInput.current.value,
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_uuid: this.venueList.current.value || this.props.venues[0].uuid,
      org_uuid: this.orgList.current.value|| this.props.orgs[0].uuid,
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

    checkedBoxes.forEach(chkbx => {
      tagsToSave.push(chkbx.value);
    });

    return {eventID: null, eventObj: eventObj, tagsToSave: tagsToSave};
  }

  /**
   * `clearForm` clears the add form by resetting the input values.
   *
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
    const defaultVenue = this.props.venues.length > 0 ? this.props.venues[0].id : '';
    const defaultOrg = this.props.orgs.length > 0 ? this.props.orgs[0].id : '';

    const currentDate = Moment().format('YYYY-MM-DD');

    const submitAction = this.user.is_su ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_su ? 'Publish Event' : 'Add Pending Event';

    return (
      <form id={'event-add-form'} className={'add-form'} onSubmit={submitAction}>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
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
          <select ref={this.venueList} defaultValue={defaultVenue}>
            {renderOptionList(this.props.venues, 'venues', 'uuid')}
          </select>
        </label>
        <label className={'required'}>
          Organizers
          <select ref={this.orgList} defaultValue={defaultOrg}>
            {renderOptionList(this.props.orgs, 'organizers', 'uuid')}
          </select>
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
          <input type={'text'} ref={this.urlInput} />
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
          <input type={'text'} ref={this.ticketUrlInput} />
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
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
