import React, {Component} from 'react';
import Moment from 'moment';
import {renderOptionList, renderCheckboxList} from "../../utilities";

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingEventRecord extends Component {
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
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleClickDelete() {
    const id = this.props.pendingEvent.id;
    this.props.deleteEvent(id);
  }

  handleSubmit(e) {
    e.preventDefault();

    const pendingEvent = this.props.pendingEvent;
    const id = pendingEvent.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueInput.current.value,
      org_id: this.orgInput.current.value,
      description: this.descInput.current.value.trim(),
      flag_ongoing: this.ongoingInput.current.checked
    };
    let tagsToSave = [], tagsToDelete = [];
    let checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    let uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');

    // Add non-required only if it has changed
    (this.emailInput.current.value !== pendingEvent.email) && (newData.email = this.emailInput.current.value.trim());
    (this.urlInput.current.value !== pendingEvent.url) && (newData.url = this.urlInput.current.value.trim());
    (this.phoneInput.current.value !== pendingEvent.phone) && (newData.phone = this.phoneInput.current.value.trim());
    (this.hoursInput.current.value !== pendingEvent.hours) && (newData.hours = this.hoursInput.current.value.trim());
    (this.ticketUrlInput.current.value !== pendingEvent.ticket_url) && (newData.ticket_url = this.ticketUrlInput.current.value.trim());
    (this.ticketPhoneInput.current.value !== pendingEvent.ticket_phone) && (newData.ticket_phone = this.ticketPhoneInput.current.value.trim());
    (this.ticketPricesInput.current.value !== pendingEvent.ticket_prices) && (newData.ticket_prices = this.ticketPricesInput.current.value.trim());

    // Tag data
    checkedBoxes.forEach(input => {
      if (!this.props.eventTags.includes(parseInt(input.value, 10))) {
        tagsToSave.push({pending_event_id: id, tag_id: input.value});
      }
    });
    uncheckedBoxes.forEach(input => tagsToDelete.push(input.value));

    this.props.saveEvent(id, newData, {to_save: tagsToSave, to_delete: tagsToDelete});
  }

  render() {
    const pendingEvent = this.props.pendingEvent;
    const eventId = this.props.pendingEvent.target_id || 'N/A';
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const tags = this.props.tags;
    const eventTags = this.props.eventTags;
    const startDate = Moment(pendingEvent.start_date).format('YYYY-MM-DD');
    const endDate = Moment(pendingEvent.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(pendingEvent.created_at).calendar();
    const updatedAt = Moment(pendingEvent.updated_at).calendar();

    return (
      <form id={'pending-event-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Event ID
          <input type={'text'} defaultValue={eventId} disabled />
        </label>
        <label>
          Created
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type="text" ref={this.nameInput} defaultValue={pendingEvent.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Start Date
          <input type="date" ref={this.startInput} defaultValue={startDate} required />
        </label>
        <label className={'required'}>
          End Date
          <input type="date" ref={this.endInput} defaultValue={endDate} required />
        </label>
        <label>
          Venue
          <select ref={this.venueInput} defaultValue={pendingEvent.venue_id || ''} required>
            {renderOptionList(venues)}
          </select>
        </label>
        <label>
          Organizer
          <select ref={this.orgInput} defaultValue={pendingEvent.org_id || ''} required>
            {renderOptionList(organizers)}
          </select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={pendingEvent.description} required />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, eventTags)}
        </label>
        <label>
          Email Address
          <input type="email" ref={this.emailInput} defaultValue={pendingEvent.email} />
        </label>
        <label>
          URL
          <input type="url" ref={this.urlInput} defaultValue={pendingEvent.url} />
        </label>
        <label>
          Phone Number
          <input type="tel" ref={this.phoneInput} defaultValue={pendingEvent.phone} />
        </label>
        <label>
          Event Hours
          <input type="text" ref={this.hoursInput} defaultValue={pendingEvent.hours} />
        </label>
        <label>
          Ticketing URL
          <input type="url" ref={this.ticketUrlInput} defaultValue={pendingEvent.ticket_url} />
        </label>
        <label>
          Ticketing Phone Number
          <input type="tel" ref={this.ticketPhoneInput} defaultValue={pendingEvent.ticket_phone} />
        </label>
        <label>
          Ticket Prices
          <input type="text" ref={this.ticketPricesInput} defaultValue={pendingEvent.ticket_prices} />
        </label>
        <label>
          <input type="checkbox" ref={this.ongoingInput} defaultChecked={pendingEvent.flag_ongoing} />
          Ongoing Event
        </label>
        <div className={'block-warning'}
             title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <button type="button" onClick={this.handleClickDelete}>Discard Event</button>
          <button type="submit" className="button-primary">Save Changes</button>
        </div>
      </form>
    );
  }
};
