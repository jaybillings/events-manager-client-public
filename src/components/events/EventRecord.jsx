import React from "react";
import Moment from "moment";
import {renderCheckboxList, renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";

import "../../styles/toggle.css";

/**
 * EventRecord is a component which displays a single event's record.
 * @class
 * @child
 */
export default class EventRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.state = {newPublishState: this.props.publishState};

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

    this.shouldPublishOrDrop = this.shouldPublishOrDrop.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new event. Also modifies
   * associations between the event and its tags.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    const publishOrDrop = this.shouldPublishOrDrop();
    const newData = {
      name: this.nameInput.current.value,
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: parseInt(this.venueInput.current.value, 10),
      org_id: parseInt(this.orgInput.current.value, 10),
      description: this.descInput.current.value,
      flag_ongoing: this.ongoingInput.current.checked
    };

    // Optional data -- only include if set
    this.emailInput.current.value !== '' && (newData.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value);
    this.hoursInput.current.value !== '' && (newData.hours = this.hoursInput.current.value);
    this.ticketUrlInput.current.value !== '' && (newData.ticket_url = this.ticketUrlInput.current.value);
    this.ticketPhoneInput.current.value !== '' && (newData.ticket_phone = this.ticketPhoneInput.current.value);
    this.ticketPricesInput.current.value !== '' && (newData.ticket_prices = this.ticketPricesInput.current.value);

    // Tag Data
    let tagsToSave = [], tagsToRemove = [];
    const checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    const uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');

    checkedBoxes.forEach(input => {
      if (!this.props.tagsForListing.includes(parseInt(input.value, 10))) {
        tagsToSave.push({event_id: this.props.listing.id, tag_id: input.value});
      }
    });
    uncheckedBoxes.forEach(input => {
      if (this.props.tagsForListing.includes(parseInt(input.value, 10))) {
        tagsToRemove.push(input.value)
      }
    });

    this.props.updateListing({
      eventData: newData,
      tagsToSave: tagsToSave,
      tagsToRemove: tagsToRemove,
      publishState: publishOrDrop
    });
  }

  /**
   * Flips the publish status of the event.
   *
   * toggleStatus changes the new publish status of the event, depending on the previous status. It uses the new publish
   * status if it is set, so the status can be properly toggled.
   */
  toggleStatus() {
    this.setState(prevState => ({newPublishState: prevState.newPublishState === 'live' ? 'dropped' : 'live'}));
  }

  /**
   * Determines if the publish status of the listing should change, and if so, to what.
   *
   * shouldPublishOrDrop provides data to tell the save function whether it should publish the event (set its status
   * to 'live') or drop it. There are actually three valid options, to cut down on extraneous server requests:
   *   * 'live' - Event should be published/set as 'live'
   *   * 'dropped' - Event should be dropped/set as 'dropped'
   *   * <empty string> - Publish status should not change
   *
   * @returns {string}
   */
  shouldPublishOrDrop() {
    if (this.state.newPublishState === this.props.publishState) return '';
    return this.state.newPublishState;
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const event = this.props.listing;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;
    const eventTags = this.props.tagsForListing;
    const isPublished = this.state.newPublishState === 'live';

    const startDate = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(event.created_at).calendar();
    const updatedAt = Moment(event.updated_at).calendar();
    const deleteButton = this.user.is_admin
      ?  <button type={'button'} onClick={this.handleDeleteClick}>Delete Event</button> : '';

    return (
      <form id={'event-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <div>
          <p className={'label'}>Status - {isPublished ? 'Published' : 'Dropped'}</p>
          <input id={`toggle-${event.id}`} type={'checkbox'} ref={this.liveToggle} className={'toggle'}
                 checked={isPublished} onChange={this.toggleStatus}
          />
          <label className={'toggle-switch'} htmlFor={'toggle-' + event.id} />
        </div>
        <label>
          UUID
          <input type={'text'} value={event.uuid} readOnly />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} value={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={event.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={this.startInput} defaultValue={startDate} required />
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={this.endInput} defaultValue={endDate} required />
        </label>
        <label className={'required'}>
          Venue
          <select ref={this.venueInput} defaultValue={event.venue_id || ''} required>{renderOptionList(venues)}</select>
        </label>
        <label className={'required'}>
          Organizer
          <select ref={this.orgInput} defaultValue={event.org_id || ''} required>{renderOptionList(orgs)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={event.description} maxLength={500} required />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, eventTags)}
        </label>
        <label>
          Email Address
          <input type={'email'} ref={this.emailInput} defaultValue={event.email} maxLength={50} />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} defaultValue={event.url} maxLength={100} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} defaultValue={event.phone} maxLength={20} />
        </label>
        <label>
          Event Hours
          <input type={'text'} ref={this.hoursInput} defaultValue={event.hours} maxLength={100} />
        </label>
        <label>
          Ticketing URL
          <input type={'url'} ref={this.ticketUrlInput} defaultValue={event.ticket_url} maxLength={150} />
        </label>
        <label>
          Ticketing Phone Number
          <input type={'tel'} ref={this.ticketPhoneInput} defaultValue={event.ticket_phone} maxLength={20} />
        </label>
        <label>
          Ticket Prices
          <input type={'text'} ref={this.ticketPricesInput} defaultValue={event.ticket_prices} maxLength={50} />
        </label>
        <label>
          <input type='checkbox' ref={this.ongoingInput} defaultChecked={event.flag_ongoing} />
          Ongoing Event
        </label>
        <div>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          {deleteButton}
        </div>
      </form>
    );
  }
};
