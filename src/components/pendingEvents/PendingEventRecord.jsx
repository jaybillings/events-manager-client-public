import React, {Component} from 'react';
import Moment from 'moment';

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

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const id = this.props.pendingEvent.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      description: this.descInput.current.value.trim(),
      flag_ongoing: this.ongoingInput.current.checked
    };

    // Add non-required only if there is a value
    this.emailInput.current.value && (newData['email'] = this.emailInput.current.value.trim());
    this.urlInput.current.value && (newData['url'] = this.urlInput.current.value.trim());
    this.phoneInput.current.value && (newData['phone'] = this.phoneInput.current.value.trim());
    this.hoursInput.current.value && (newData['hours'] = this.hoursInput.current.value.trim());
    this.ticketUrlInput.current.value && (newData['ticket_url'] = this.ticketUrlInput.current.value.trim());
    this.ticketPhoneInput.current.value && (newData['ticket_phone'] = this.ticketPhoneInput.current.value.trim());
    this.ticketPricesInput.current.value && (newData['ticket_prices'] = this.ticketPricesInput.current.value.trim());

    this.props.saveEvent(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingEvent.id;
    this.props.deleteEvent(id);
  }

  render() {
    const pendingEvent = this.props.pendingEvent;
    const eventId = this.props.pendingEvent['targetId'] || 'N/A';
    const startDate = Moment(pendingEvent['start_date']).format('YYYY-MM-DD');
    const endDate = Moment(pendingEvent['end_date']).format('YYYY-MM-DD');
    const createdAt = Moment(pendingEvent['created_at']).calendar();
    const updatedAt = Moment(pendingEvent['updated_at']).calendar();

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
          <input type="date" ref={this.emailInput} defaultValue={endDate} required />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={pendingEvent.description} required />
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
          <input type="tel" ref="phoneInput" defaultValue={pendingEvent.phone} />
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
        <div className={'block-warning'} title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <button type="submit" className="button-primary">Save Changes</button>
          <button type="button" onClick={this.handleClickDelete}>Discard Event</button>
        </div>
      </form>
    );
  }
};
