import React, {Component} from 'react';
import app from '../../services/socketio';
import {renderOptionList, friendlyDate} from '../../utilities';

import '../../styles/schema-record.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false};
    this.eventsService = app.service('events');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.saveTags = this.saveTags.bind(this);
    this.renderTagsInput = this.renderTagsInput.bind(this);
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
      name: this.refs.nameInput.value.trim(),
      start_date: this.refs.startInput.value,
      end_date: this.refs.endInput.value,
      venue_id: this.refs.venueList.value,
      org_id: this.refs.orgList.value,
      description: this.refs.descInput.value.trim(),
      flag_ongoing: this.refs.ongoingInput.checked
    };

    // Only add non-required if they have a value
    this.refs.emailInput.value && (newData['email'] = this.refs.emailInput.value.trim());
    this.refs.urlInput.value && (newData['url'] = this.refs.urlInput.value.trim());
    this.refs.phoneInput.value && (newData['phone'] = this.refs.phoneInput.value.trim());
    this.refs.hoursInput.value && (newData['hours'] = this.refs.hoursInput.value.trim());
    this.refs.ticketUrlInput.value && (newData['ticket_url'] = this.refs.ticketUrlInput.value.trim());
    this.refs.ticketPhoneInput.value && (newData['ticket_phone'] = this.refs.ticketPhoneInput.value.trim());
    this.refs.ticketPricesInput.value && (newData['ticket_prices'] = this.refs.ticketPricesInput.value.trim());

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
    let checkedBoxes = document.querySelectorAll('.js-tag-checkbox:checked');
    let uncheckedBoxes = document.querySelectorAll('.js-tag-checkbox:not(:checked)');

    checkedBoxes.forEach(input => {
      if (!this.props.eventTags.includes(parseInt(input.value, 10))) tagsToSave.push({'event_id': id, 'tag_id': input.value})
    });
    uncheckedBoxes.forEach(input => tagsToDelete.push(input.value));

    this.tagsLookupService.remove(null, {query: {event_id: id, tag_id: {$in: tagsToDelete}}}).then(message =>{
      console.log('removed', message);
    }, reason => console.log('error', reason));

    this.tagsLookupService.create(tagsToSave).then(message => {
      console.log('created', message);
    }, reason => console.log('error', reason));
  }

  renderTagsInput() {
    let tagsList = [];

    this.props.tags.forEach(tag => {
      tagsList.push(
        <label key={tag.id}>
          <input type={'checkbox'} id={`tag-${tag.id}`} className={'js-tag-checkbox'} value={tag.id}
                 defaultChecked={this.props.eventTags.includes(tag.id)} />
          {tag.name}
        </label>);
    });

    return tagsList;
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const createdAt = friendlyDate(event.created_at);
    const updatedAt = friendlyDate(event.updated_at);

    return (
      <form id="event-listing-form" className={'schema-record'} onSubmit={this.saveEvent}>
        <div>
          <button type="button" ref="deleteButton" onClick={this.deleteEvent}>Delete Event</button>
          <button type="submit" ref="submitButton" className="button-primary">Save Changes</button>
        </div>
        <label>
          ID
          <input type="text" defaultValue={event.id} disabled/>
        </label>
        <label>
          Created at
          <input type="text" defaultValue={createdAt} disabled/>
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedAt} disabled/>
        </label>
        <label>
          Name
          <input type="text" ref="nameInput" defaultValue={event.name} required />
        </label>
        <label>
          Start Date
          <input type="date" ref="startInput" defaultValue={event.start_date} required />
        </label>
        <label>
          End Date
          <input type="date" ref="endInput" defaultValue={event.end_date} required />
        </label>
        <label>
          Venue
          <select ref="venueList" defaultValue={event.venue_id || ''} required>{renderOptionList(venues)}</select>
        </label>
        <label>
          Organizer
          <select ref="orgList" defaultValue={event.org_id || ''} required>{renderOptionList(organizers)}</select>
        </label>
        <label>
          Tags
          {this.renderTagsInput()}
        </label>
        <label>
          Description
          <textarea ref="descInput" defaultValue={event.description} required />
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
      </form>
    );
  }
};
