import React from 'react';
import Moment from 'moment';
import {diffListings, diffTags, renderCheckboxList, renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * `PendingEventRecord` displays a single pending event record.
 *
 * @class
 * @child
 */
export default class PendingEventRecord extends ListingRecordUniversal {
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
   *
   * @override
   */
  componentDidMount() {
    this.getWriteStatus()
      .then(writeStatus => {
        console.debug('writeStatus', writeStatus);
        this.setState({writeStatus})
      });
  }

  /**
   * `handleSaveClick` parses the new data and calls a function to create a new pending organizer.
   * It also modifies the associations between the pending event and its tags as needed.
   *
   * @override
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
      if (!this.props.tagsForPendingListing.includes(input.value)) {
        tagsToSave.push({event_uuid: this.props.listing.uuid, tag_uuid: input.value});
      }
    });
    uncheckedBoxes.forEach(input => {
      if (this.props.tagsForPendingListing.includes(input.value)) {
        tagsToRemove.push(input.value)
      }
    });

    this.props.updateListing({eventData: newData, tagsToSave: tagsToSave, tagsToRemove: tagsToRemove});
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const event = this.props.listing;
    const liveEvent = this.props.matchingLiveListing;
    const writeStatus = this.state.writeStatus;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;
    const tagsForPendingListing = this.props.tagsForPendingListing;

    const startDate = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('YYYY-MM-DD');
    const createdAt = Moment(event.created_at).calendar();
    const updatedAt = Moment(event.updated_at).calendar();

    const eventParams = ['name', 'start_date', 'end_date', 'venue_uuid',
      'org_uuid', 'description', 'email', 'url', 'phone', 'hours',
      'ticket_url', 'ticket_phone', 'ticket_prices', 'flag_ongoing'];
    const classNameMap = diffListings(liveEvent, event, eventParams);

    let tagDiffList = [];
    if (this.props.tagsForListing && this.props.tagsForPendingListing) {
      tagDiffList = diffTags(this.props.tagsForListing, this.props.tagsForPendingListing);
    }

    return (
      <form id={'pending-event-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <div>
          <button type={'button'} className={'default'} onClick={this.handleDeleteClick}>Discard Event</button>
          <button type={'submit'} className={"button-primary"}>Save Changes</button>
        </div>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-events'} />
          </div>
        </label>
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
          <input type="text" value={updatedAt} disabled />
        </label>
        <label className={'required' + classNameMap['name']}>
          Name
          <input type="text" ref={this.nameInput} defaultValue={event.name} required maxLength={100} />
        </label>
        <label className={'required-ish' + classNameMap['start_date']}>
          Start Date
          <input type="date" ref={this.startInput} defaultValue={startDate} />
        </label>
        <label className={'required-ish' + classNameMap['end_date']}>
          End Date
          <input type="date" ref={this.endInput} defaultValue={endDate} />
        </label>
        <label className={'required-ish' + classNameMap['venue_uuid']}>
          Venue
          <select ref={this.venueInput} defaultValue={event.venue_uuid || ''}>
            {renderOptionList(venues, 'venues', 'uuid')}
          </select>
        </label>
        <label className={'required-ish' + classNameMap['org_uuid']}>
          Organizer
          <select ref={this.orgInput} defaultValue={event.org_uuid || ''}>
            {renderOptionList(orgs, 'organizers', 'uuid')}
          </select>
        </label>
        <label className={'required-ish' + classNameMap['description']}>
          Description
          <textarea ref={this.descInput} defaultValue={event.description} maxLength={500} />
        </label>
        <label>
          Tags
          {renderCheckboxList(tags, tagsForPendingListing, tagDiffList)}
        </label>
        <label className={classNameMap['email']}>
          Email Address
          <input type={"email"} ref={this.emailInput} defaultValue={event.email} />
        </label>
        <label className={classNameMap['url']}>
          URL
          <input type={"url"} ref={this.urlInput} defaultValue={event.url} />
        </label>
        <label className={classNameMap['phone']}>
          Phone Number
          <input type={"tel"} ref={this.phoneInput} defaultValue={event.phone} />
        </label>
        <label className={classNameMap['hours']}>
          Event Hours
          <input type={"text"} ref={this.hoursInput} defaultValue={event.hours} />
        </label>
        <label className={classNameMap['ticket_url']}>
          Ticketing URL
          <input type={"url"} ref={this.ticketUrlInput} defaultValue={event.ticket_url} />
        </label>
        <label className={classNameMap['ticket_phone']}>
          Ticketing Phone Number
          <input type={"tel"} ref={this.ticketPhoneInput} defaultValue={event.ticket_phone} />
        </label>
        <label className={classNameMap['ticket_prices']}>
          Ticket Prices
          <input type={"text"} ref={this.ticketPricesInput} defaultValue={event.ticket_prices} />
        </label>
        <label className={classNameMap['flag_ongoing']}>
          <input type={"checkbox"} ref={this.ongoingInput} defaultChecked={event.flag_ongoing} />
          Ongoing Event
        </label>
        <div>
          <button type={'button'} className={'default'} onClick={this.handleDeleteClick}>Discard Event</button>
          <button type={'submit'} className={"button-primary"}>Save Changes</button>
        </div>
      </form>
    );
  }
};
