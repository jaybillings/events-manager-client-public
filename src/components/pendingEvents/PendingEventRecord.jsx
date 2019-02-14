import React from 'react';
import Moment from 'moment';
import {renderCheckboxList, renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingEventRecord is a component which displays a single pending event's record.
 * @class
 * @child
 */
export default class PendingEventRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{listing: Object, schema: String, venues: Array, orgs: Array, tags: Array, tagsForListing: Array, updateListing: Function, deleteListing: Function, queryForExisting: Function}} props
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
    this.venueInput = React.createRef();
    this.orgInput = React.createRef();
  }

  /**
   * Runs when the component mounts. Checks the event's publish status.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new pending organizer. Also
   * modifies associations between the pending event and its tags.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_uuid: this.venueInput.current.value,
      org_uuid: this.orgInput.current.value,
      description: this.descInput.current.value,
      flag_ongoing: this.ongoingInput.current.checked
    };

    // Add non-required only if it has changed
    this.emailInput.current.value !== '' && (newData.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value);
    this.hoursInput.current.value !== '' && (newData.hours = this.hoursInput.current.value);
    this.ticketUrlInput.current.value !== '' && (newData.ticket_url = this.ticketUrlInput.current.value);
    this.ticketPhoneInput.current.value !== '' && (newData.ticket_phone = this.ticketPhoneInput.current.value);
    this.ticketPricesInput.current.value !== '' && (newData.ticket_prices = this.ticketPricesInput.current.value);

    // Tag data
    let tagsToSave = [], tagsToRemove = [];
    let checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    let uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');

    checkedBoxes.forEach(input => {
      if (!this.props.tagsForListing.includes(input.value)) {
        tagsToSave.push({pending_event_id: this.props.listing.id, tag_uuid: input.value});
      }
    });
    uncheckedBoxes.forEach(input => {
      if (this.props.tagsForListing.includes(input.value)) {
        tagsToRemove.push(input.value)
      }
    });

    this.props.updateListing({eventData: newData, tagsToSave: tagsToSave, tagsToRemove: tagsToRemove});
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
    const writeStatus = this.state.writeStatus;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;
    const tagsForListing = this.props.tagsForListing;

    const startDate = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(event.created_at).calendar();
    const updatedAt = Moment(event.updated_at).calendar();

    return (
      <form id={'pending-event-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-events'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={event.uuid} disabled />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} disabled />
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
          <select ref={this.venueInput} defaultValue={event.venue_uuid || ''} required>
            {renderOptionList(venues, 'uuid')}
          </select>
        </label>
        <label className={'required'}>
          Organizer
          <select ref={this.orgInput} defaultValue={event.org_uuid || ''} required>
            {renderOptionList(orgs, 'uuid')}
          </select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={event.description} required maxLength={500} />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, tagsForListing, 'uuid')}
        </label>
        <label>
          Email Address
          <input type={"email"} ref={this.emailInput} defaultValue={event.email} />
        </label>
        <label>
          URL
          <input type={"url"} ref={this.urlInput} defaultValue={event.url} />
        </label>
        <label>
          Phone Number
          <input type={"tel"} ref={this.phoneInput} defaultValue={event.phone} />
        </label>
        <label>
          Event Hours
          <input type={"text"} ref={this.hoursInput} defaultValue={event.hours} />
        </label>
        <label>
          Ticketing URL
          <input type={"url"} ref={this.ticketUrlInput} defaultValue={event.ticket_url} />
        </label>
        <label>
          Ticketing Phone Number
          <input type={"tel"} ref={this.ticketPhoneInput} defaultValue={event.ticket_phone} />
        </label>
        <label>
          Ticket Prices
          <input type={"text"} ref={this.ticketPricesInput} defaultValue={event.ticket_prices} />
        </label>
        <label>
          <input type={"checkbox"} ref={this.ongoingInput} defaultChecked={event.flag_ongoing} />
          Ongoing Event
        </label>
        <div className={'block-warning'}
             title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'button'} onClick={this.handleDeleteClick}>Discard Event</button>
          <button type={'submit'} className={"button-primary"}>Save Changes</button>
        </div>
      </form>
    );
  }
};
