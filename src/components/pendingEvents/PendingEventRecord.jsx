import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingEventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false};

    this.pendingEventsService = app.service('pending-events');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
  }

  deleteEvent() {
    const id = this.props.pendingEvent.id;
    this.pendingEventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveEvent(e) {
    e.preventDefault();

    const id = this.props.pendingEvent.id;
    const newData = {
      name: this.refs['nameInput'].value.trim(),
      start_date: Moment(this.refs['startInput'].value).valueOf(),
      end_date: Moment(this.refs['endInput'].value).valueOf(),
      description: this.refs['descInput'].value.trim(),
      flag_ongoing: this.refs['ongoingInput'].checked
    };

    // Add non-required only if there is a value
    this.refs['emailInput'].value && (newData['email'] = this.refs['emailInput'].value.trim());
    this.refs['urlInput'].value && (newData['url'] = this.refs['urlInput'].value.trim());
    this.refs['phoneInput'].value && (newData['phone'] = this.refs['phoneInput'].value.trim());
    this.refs['hoursInput'].value && (newData['hours'] = this.refs['hoursInput'].value.trim());
    this.refs['ticketUrlInput'].value && (newData['ticket_url'] = this.refs['ticketUrlInput'].value.trim());
    this.refs['ticketPhoneInput'].value && (newData['ticket_phone'] = this.refs['ticketPhoneInput'].value.trim());
    this.refs['ticketPricesInput'].value && (newData['ticket_prices'] = this.refs['ticketPricesInput'].value.trim());

    // TODO: Add message window
    this.pendingEventsService.patch(id, newData).then(message => {
      console.log('patched', message);
    }, message => {
      console.log('error', JSON.stringify(message));
    });
  }

  render() {
    const pendingEvent = this.props.pendingEvent;
    const eventId = this.props.pendingEvent['targetId'] || 'N/A';
    const startDate = Moment(pendingEvent['start_date']).format('YYYY-MM-DD');
    const endDate = Moment(pendingEvent['end_date']).format('YYYY-MM-DD');
    const createdAt = Moment(pendingEvent['created_at']).calendar();
    const updatedAt = Moment(pendingEvent['updated_at']).calendar();

    return (
      <form id={'pending-event-listing-form'} className={'schema-record'} onSubmit={this.saveEvent}>
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
          <input type="text" ref="nameInput" defaultValue={pendingEvent.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Start Date
          <input type="date" ref="startInput" defaultValue={startDate} required />
        </label>
        <label className={'required'}>
          End Date
          <input type="date" ref="endInput" defaultValue={endDate} required />
        </label>
        <label className={'required'}>
          Description
          <textarea ref="descInput" defaultValue={pendingEvent.description} required />
        </label>
        <label>
          Email Address
          <input type="email" ref="emailInput" defaultValue={pendingEvent.email} />
        </label>
        <label>
          URL
          <input type="url" ref="urlInput" defaultValue={pendingEvent.url} />
        </label>
        <label>
          Phone Number
          <input type="tel" ref="phoneInput" defaultValue={pendingEvent.phone} />
        </label>
        <label>
          Event Hours
          <input type="text" ref="hoursInput" defaultValue={pendingEvent.hours} />
        </label>
        <label>
          Ticketing URL
          <input type="url" ref="ticketUrlInput" defaultValue={pendingEvent.ticket_url} />
        </label>
        <label>
          Ticketing Phone Number
          <input type="tel" ref="ticketPhoneInput" defaultValue={pendingEvent.ticket_phone} />
        </label>
        <label>
          Ticket Prices
          <input type="text" ref="ticketPricesInput" defaultValue={pendingEvent.ticket_prices} />
        </label>
        <label>
          <input type="checkbox" ref="ongoingInput" defaultChecked={pendingEvent.flag_ongoing} />
          Ongoing Event
        </label>
        <div className={'block-warning'} title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <button type="button" ref="deleteButton" onClick={this.deleteEvent}>Discard Event</button>
          <button type="submit" ref="submitButton" className="button-primary">Save Changes</button>
        </div>
      </form>
    );
  }
};
