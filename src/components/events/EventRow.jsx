import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";
import StatusLabel from "../common/StatusLabel";

import "../../styles/toggle.css";

/**
 * EventRow is a component which displays a single row for a live event table.
 * @class
 * @child
 */
export default class EventRow extends ListingRow {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param {{schema: String, listing: Object, venues: Array, orgs: Array, venue: Object, org: Object, updateListing: Function, deleteListing: Function, createPendingListing: Function, listingIsLive: Boolean, checkForPending: Function}} props
   */
  constructor(props) {
    super(props);

    const linkedVenueUUID = this.props.venue ? this.props.venue.uuid : null;
    const linkedOrgUUID = this.props.org ? this.props.org.uuid : null;

    this.state = {
      ...this.state, is_published: this.props.listingIsLive,
      eventStart: this.props.listing.start_date, eventEnd: this.props.listing.end_date,
      linkedVenueUUID, linkedOrgUUID
    };
  }

  componentWillReceiveProps(nextProps, nextContext) {
    // TODO: This is a band-aid. Figure out a better way to do this.
    if (nextProps.listingIsLive !== this.props.listingIsLive) {
      this.setState({is_published: nextProps.listingIsLive});
    }
  }

  /**
   * Handles changes to input block by saving the data as a state parameter.
   * @override
   *
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name) return;

    if (e.target.name === 'is_published') {
      this.setState(prevState => ({is_published: !prevState.is_published}));
    } else {
      this.setState({[e.target.name]: e.target.value.trim()});
    }
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the event.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      uuid: this.props.listing.uuid,
      name: this.state.listingName,
      start_date: Moment(this.state.eventStart).valueOf(),
      end_date: Moment(this.state.eventEnd).valueOf(),
      venue_uuid: this.state.linkedVenueUUID,
      org_uuid: this.state.linkedOrgUUID
    };

    this.props.updateListing(this.props.listing.id, {newData: newData, doPublish: this.state.is_published})
      .then(() => {
        this.setState({editable: false});
      });
  }

  /**
   * Handles the copy button click by parsing the listing data and triggering a function to create a pending
   * event with the parsed data.
   */
  handleCopyClick(e) {
    e.stopPropagation();

    // noinspection JSUnusedLocalSymbols
    let {id, org_id, venue_id, ...eventData} = this.props.listing;

    eventData.org_uuid = this.props.org.uuid;
    eventData.venue_uuid = this.props.venue.uuid;
    eventData.created_at = Moment(eventData.created_at).valueOf();
    eventData.updated_at = Moment(eventData.updated_at).valueOf();

    this.props.createPendingListing({eventID: id, eventObj: eventData, tagsToSave: null}).then(() => {
      this.listingHasPending();
    });
  }

  /**
   * Renders the component.
   * @note The render has two different paths depending on whether the row can be edited.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const listingID = this.props.listing.id;
    const listingName = this.state.listingName;
    const venueUUID = this.state.linkedVenueUUID || '';
    const orgUUID = this.state.linkedOrgUUID || '';
    const publishStatus = this.state.is_published;
    const venues = this.props.venues;
    const orgs = this.props.orgs;

    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      const startDateVal = Moment(this.state.eventStart).format('YYYY-MM-DD');
      const endDateVal = Moment(this.state.eventEnd).format('YYYY-MM-DD');

      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'submit'} className={'emphasize more'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={listingName} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventStart'} value={startDateVal} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventEnd'} value={endDateVal} onChange={this.handleInputChange} /></td>
          <td>
            <select name={'linkedVenueUUID'} value={venueUUID} onChange={this.handleInputChange}>
              {renderOptionList(venues, 'venues', 'uuid')}
            </select>
          </td>
          <td>
            <select name={'linkedOrgUUID'} value={orgUUID} onChange={this.handleInputChange}>
              {renderOptionList(orgs, 'organizers', 'uuid')}
            </select>
          </td>
          <td>{updatedAt}</td>
          <td>
            <input id={'toggle-' + listingID} name={'is_published'} type={'checkbox'} className={'toggle'}
                   checked={publishStatus} onChange={this.handleInputChange} />
            <label className={'toggle-switch'} htmlFor={'toggle-' + listingID} />
          </td>
        </tr>
      );
    }


    const startDate = Moment(this.state.eventStart).format('MM/DD/YYYY');
    const endDate = Moment(this.state.eventEnd).format('MM/DD/YYYY');
    const eventStatus = this.state.is_published ? 'live' : 'dropped';

    const venueLink = this.props.venue
      ? <Link to={`/venues/${this.props.venue.id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.org
      ? <Link to={`/organizers/${this.props.org.id}`}>{this.props.org.name}</Link> : 'NO ORGANIZER';
    const deleteButton = this.user.is_admin ?
      <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete</button> : '';

    return (
      <tr className={'schema-row'}>
        <td>
          {this.renderEditButton()}
          {deleteButton}
        </td>
        <td><Link to={`/events/${listingID}`}>{listingName}</Link></td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{updatedAt}</td>
        <td><StatusLabel writeStatus={eventStatus} schema={'events'} /></td>
      </tr>
    );
  }
};
