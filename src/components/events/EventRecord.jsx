import React from "react";
import Moment from "moment";
import {renderCheckboxList, renderOptionList} from "../../utilities";

import "../../styles/toggle.css";

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * EventRecord is a component to display a single event's record.
 *
 * @class
 * @child
 */
export default class EventRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.state = {defaultPublish: false, newPublish: false};

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

    this.checkPublishOrDrop = this.checkPublishOrDrop.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
  }

  /**
   * Runs once the component mounts. Checks for the event's publish/live status.
   */
  componentDidMount() {
    this.props.checkForLive().then(results => {
      const publishState = results.total > 0;
      this.setState({defaultPublish: publishState, newPublish: publishState});
    }, err => {
      console.log('error in checking for live', JSON.stringify(err));
    });
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new event. Also modifies
   * associations between the event and its tags.
   *
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const doPublish = this.checkPublishOrDrop();
    const newData = {
      name: this.nameInput.current.value.trim(),
      venue_id: parseInt(this.venueInput.current.value, 10),
      org_id: parseInt(this.orgInput.current.value, 10),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      description: this.descInput.current.value || null,
      email: this.emailInput.current.value || null,
      url: this.urlInput.current.value || null,
      phone: this.phoneInput.current.value || null,
      hours: this.hoursInput.current.value || null,
      ticket_url: this.ticketUrlInput.current.value || null,
      ticket_phone: this.ticketPhoneInput.current.value || null,
      ticket_prices: this.ticketPricesInput.current.value|| null,
      flag_ongoing: this.ongoingInput.current.checked
    };

    // Tag Data
    const checkedBoxes = document.querySelectorAll('.js-checkbox:checked');
    const uncheckedBoxes = document.querySelectorAll('.js-checkbox:not(:checked)');
    let tagsToSave = [], tagsToRemove = [];

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

    this.props.updateListing(newData, {toSave: tagsToSave, toRemove: tagsToRemove}, doPublish);
  }

  /**
   * Flips the publish/live status of the event.
   */
  toggleStatus() {
    this.setState(prevStatus => ({newPublish: !prevStatus.newPublish}));
  }

  /**
   * Determines whether the event should be published or dropped.
   *
   * @returns {string}
   */
  checkPublishOrDrop() {
    if (this.state.defaultPublish === this.state.newPublish) return '';
    if (this.state.newPublish) return 'publish';
    if (!this.state.newPublish) return 'drop';
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const event = this.props.listing;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;
    const isPublished = this.state.newPublish;
    const eventTags = this.props.tagsForListing;

    const startDate = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(event.created_at).calendar();
    const updatedAt = Moment(event.updated_at).calendar();

    return (
      <form id={'event-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
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
          Tags {renderCheckboxList(tags, eventTags)}
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
          <button type={'button'} onClick={this.handleDeleteClick}>Delete Event</button>
        </div>
      </form>
    );
  }
};
