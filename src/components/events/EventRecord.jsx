import React, {Component} from 'react';
import Moment from 'moment';
import {renderOptionList, renderCheckboxList} from '../../utilities';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false, tmpStatus: this.props.event.is_published};

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
    this.liveToggle = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  handleClickDelete() {
    const id = this.props.event.id;
    this.props.deleteEvent(id);
  }

  handleSubmit(e) {
    e.preventDefault();

    const event = this.props.event;
    const id = this.props.event.id;
    const checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    const uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueInput.current.value,
      org_id: this.orgInput.current.value,
      description: this.descInput.current.value.trim(),
      flag_ongoing: this.ongoingInput.current.checked,
      is_published: this.liveToggle.current.checked
    };
    let tagsToSave = [], tagsToDelete = [];

    // Only add non-required if they have a value
    (this.emailInput.current.value !== event.email) && (newData.email = this.emailInput.current.value.trim());
    (this.urlInput.current.value !== event.url) && (newData.url = this.urlInput.current.value.trim());
    (this.phoneInput.current.value !== event.phone) && (newData.phone = this.phoneInput.current.value.trim());
    (this.hoursInput.current.value !== event.hours) && (newData.hours = this.hoursInput.current.value.trim());
    (this.ticketUrlInput.current.value !== event.ticket_url) && (newData.ticket_url = this.ticketUrlInput.current.value.trim());
    (this.ticketPhoneInput.current.value !== event.ticket_phone) && (newData.ticket_phone = this.ticketPhoneInput.current.value.trim());
    (this.ticketPricesInput.current.value !== event.ticket_prices) && (newData.ticket_prices = this.ticketPricesInput.current.value.trim());

    // Tag data
    checkedBoxes.forEach(input => {
      if (!this.props.eventTags.includes(parseInt(input.value, 10))) {
        tagsToSave.push({event_id: id, tag_id: input.value});
      }
    });
    uncheckedBoxes.forEach(input => tagsToDelete.push(input.value));

    this.props.saveEvent(id, newData, {to_save: tagsToSave, to_delete: tagsToDelete});
  }

  toggleStatus() {
    this.setState({ tmpStatus: this.liveToggle.current.checked});
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const tags = this.props.tags;
    const eventTags = this.props.eventTags;
    const startDate = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(event.created_at).calendar();
    const updatedAt = Moment(event.updated_at).calendar();

    return (
      <form id={'event-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <div>
          <p className={'label'}>Status</p>
          <input id={'toggle-' + event.id} ref={this.liveToggle} className={'toggle'} type={'checkbox'}
                 defaultChecked={event.is_published} onClick={this.toggleStatus} />
          <label className={'toggle-switch'} htmlFor={'toggle-' + event.id} />
          <span ref={'statusLabel'}>{this.state.tmpStatus ? 'Published' : 'Dropped'}</span>
        </div>
        <label>
          ID
          <input type="text" value={event.id} disabled />
        </label>
        <label>
          Created
          <input type="text" value={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type="text" value={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type="text" ref={this.nameInput} defaultValue={event.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Start Date
          <input type="date" ref={this.startInput} defaultValue={startDate} required />
        </label>
        <label className={'required'}>
          End Date
          <input type="date" ref={this.endInput} defaultValue={endDate} required />
        </label>
        <label className={'required'}>
          Venue
          <select ref={this.venueInput} defaultValue={event.venue_id || ''} required>{renderOptionList(venues)}</select>
        </label>
        <label className={'required'}>
          Organizer
          <select ref={this.orgInput} defaultValue={event.org_id || ''} required>{renderOptionList(organizers)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={event.description} required />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, eventTags)}
        </label>
        <label>
          Email Address
          <input type="email" ref={this.emailInput} defaultValue={event.email} />
        </label>
        <label>
          URL
          <input type="url" ref={this.urlInput} defaultValue={event.url} />
        </label>
        <label>
          Phone Number
          <input type="tel" ref={this.phoneInput} defaultValue={event.phone} />
        </label>
        <label>
          Event Hours
          <input type="text" ref={this.hoursInput} defaultValue={event.hours} />
        </label>
        <label>
          Ticketing URL
          <input type="url" ref={this.ticketUrlInput} defaultValue={event.ticket_url} />
        </label>
        <label>
          Ticketing Phone Number
          <input type="tel" ref={this.ticketPhoneInput} defaultValue={event.ticket_phone} />
        </label>
        <label>
          Ticket Prices
          <input type="text" ref={this.ticketPricesInput} defaultValue={event.ticket_prices} />
        </label>
        <label>
          <input type="checkbox" ref={this.ongoingInput} defaultChecked={event.flag_ongoing} />
          Ongoing Event
        </label>
        <div>
          <button type="submit" className="button-primary">Save Changes</button>
          <button type="button" onClick={this.handleClickDelete}>Delete Event</button>
        </div>
      </form>
    );
  }
};
