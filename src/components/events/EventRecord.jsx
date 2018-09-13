import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';
import {renderOptionList, renderCheckboxList} from '../../utilities';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false, tmpStatus: this.props.event.is_published};
    this.eventsService = app.service('events');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.saveTags = this.saveTags.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  deleteEvent() {
    // TODO: Only administrators should be able to delete
    const id = this.props.event.id;
    this.eventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveEvent(e) {
    e.preventDefault();

    const id = this.props.event.id;
    const newData = {
      name: this.refs['nameInput'].value.trim(),
      start_date: Moment(this.refs['startInput'].value).valueOf(),
      end_date: Moment(this.refs['endInput'].value).valueOf(),
      venue_id: this.refs['venueList'].value,
      org_id: this.refs['orgList'].value,
      description: this.refs['descInput'].value.trim(),
      flag_ongoing: this.refs['ongoingInput'].checked,
      is_published: this.refs['statusInput'].checked
    };

    // Only add non-required if they have a value
    this.refs['emailInput'].value && (newData['email'] = this.refs['emailInput'].value.trim());
    this.refs['urlInput'].value && (newData['url'] = this.refs['urlInput'].value.trim());
    this.refs['phoneInput'].value && (newData['phone'] = this.refs['phoneInput'].value.trim());
    this.refs['hoursInput'].value && (newData['hours'] = this.refs['hoursInput'].value.trim());
    this.refs['ticketUrlInput'].value && (newData['ticket_url'] = this.refs['ticketUrlInput'].value.trim());
    this.refs['ticketPhoneInput'].value && (newData['ticket_phone'] = this.refs['ticketPhoneInput'].value.trim());
    this.refs['ticketPricesInput'].value && (newData['ticket_prices'] = this.refs['ticketPricesInput'].value.trim());

    this.eventsService.patch(id, newData).then(message => {
      console.log('patch', message);
      this.saveTags();
    }, message => {
      console.log('error', JSON.stringify(message));
    });
  }

  saveTags() {
    const id = this.props.event.id;
    let tagsToSave = [], tagsToDelete = [];
    let checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    let uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');

    checkedBoxes.forEach(input => {
      if (!this.props.eventTags.includes(parseInt(input.value, 10))) tagsToSave.push({
        'event_id': id,
        'tag_id': input.value
      });
    });
    uncheckedBoxes.forEach(input => tagsToDelete.push(input.value));

    this.tagsLookupService.remove(null, {query: {event_id: id, tag_id: {$in: tagsToDelete}}}).then(message => {
      console.log('removed', message);
    }, reason => console.log('error', reason));

    this.tagsLookupService.create(tagsToSave).then(message => {
      console.log('created', message);
    }, reason => console.log('error', reason));
  }

  toggleStatus() {
    this.setState({ tmpStatus: this.refs['statusInput'].checked});
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const tags = this.props.tags;
    const startDate = Moment(event['start_date']).format('YYYY-MM-DD');
    const endDate = Moment(event['end_date']).format('YYYY-MM-DD');
    const createdAt = Moment(event['created_at']).calendar();
    const updatedAt = Moment(event['updated_at']).calendar();

    return (
      <form id="event-listing-form" className={'schema-record'} onSubmit={this.saveEvent}>
        <div>
          <p className={'label'}>Status</p>
          <input id={'toggle-' + event.id} ref={'statusInput'} className={'toggle'} type={'checkbox'}
                 defaultChecked={event.is_published} onClick={this.toggleStatus} />
          <label className={'toggle-switch'} htmlFor={'toggle-' + event.id} />
          <span ref={'statusLabel'}>{this.state.tmpStatus ? 'Published' : 'Dropped'}</span>
        </div>
        <label>
          ID
          <input type="text" defaultValue={event.id} disabled />
        </label>
        <label>
          Created
          <input type="text" defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type="text" ref="nameInput" defaultValue={event.name} required maxLength={100} />
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
          Venue
          <select ref="venueList" defaultValue={event.venue_id || ''} required>{renderOptionList(venues)}</select>
        </label>
        <label className={'required'}>
          Organizer
          <select ref="orgList" defaultValue={event.org_id || ''} required>{renderOptionList(organizers)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref="descInput" defaultValue={event.description} required />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, this.props.eventTags)}
        </label>
        <label>
          Email Address
          <input type="email" ref="emailInput" defaultValue={event.email} />
        </label>
        <label>
          URL
          <input type="url" ref="urlInput" defaultValue={event.url} />
        </label>
        <label>
          Phone Number
          <input type="tel" ref="phoneInput" defaultValue={event.phone} />
        </label>
        <label>
          Event Hours
          <input type="text" ref="hoursInput" defaultValue={event.hours} />
        </label>
        <label>
          Ticketing URL
          <input type="url" ref="ticketUrlInput" defaultValue={event.ticket_url} />
        </label>
        <label>
          Ticketing Phone Number
          <input type="tel" ref="ticketPhoneInput" defaultValue={event.ticket_phone} />
        </label>
        <label>
          Ticket Prices
          <input type="text" ref="ticketPricesInput" defaultValue={event.ticket_prices} />
        </label>
        <label>
          <input type="checkbox" ref="ongoingInput" defaultChecked={event.flag_ongoing} />
          Ongoing Event
        </label>
        <div>
          <button type="button" ref="deleteButton" onClick={this.deleteEvent}>Delete Event</button>
          <button type="submit" ref="submitButton" className="button-primary">Save Changes</button>
        </div>
      </form>
    );
  }
};
