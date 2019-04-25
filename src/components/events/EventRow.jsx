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

    const event = this.props.listing;
    const venueID = this.props.venue ? this.props.venue.id : (this.props.venues[0] ? this.props.venues[0].id : null);
    const orgID = this.props.org ? this.props.org.id : (this.props.orgs[0] ? this.props.orgs[0].id : null);

    Object.assign(this.state, {
      is_published: this.props.listingIsLive, eventStart: event.start_date, eventEnd: event.end_date,
      eventVenue: venueID, eventOrg: orgID
    });
  }

  /**
   * Runs once the component mounts. Checks the live status of the event.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();
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
      venue_id: this.state.eventVenue,
      org_id: this.state.eventOrg
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
    const id = this.props.listing.id;
    const name = this.state.listingName;
    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      const startDateVal = Moment(this.state.eventStart).format('YYYY-MM-DD');
      const endDateVal = Moment(this.state.eventEnd).format('YYYY-MM-DD');
      const defaultVenue = this.state.eventVenue || this.props.venues[0].id;
      const defaultOrg = this.state.eventOrg || this.props.orgs[0].id;

      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'submit'} className={'emphasize more'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventStart'} value={startDateVal} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventEnd'} value={endDateVal} onChange={this.handleInputChange} /></td>
          <td>
            <select name={'eventVenue'} value={defaultVenue} onChange={this.handleInputChange}>
              {renderOptionList(this.props.venues, 'venues')}
            </select>
          </td>
          <td>
            <select name={'eventOrg'} value={defaultOrg} onChange={this.handleInputChange}>
              {renderOptionList(this.props.orgs, 'organizers')}
            </select>
          </td>
          <td>{updatedAt}</td>
          <td>
            <input id={'toggle-' + id} name={'is_published'} type={'checkbox'} className={'toggle'}
                   checked={this.state.is_published} onChange={this.handleInputChange} />
            <label className={'toggle-switch'} htmlFor={'toggle-' + id} />
          </td>
        </tr>
      );
    }

    const endDate = Moment(this.state.eventEnd).format('MM/DD/YYYY');
    const startDate = Moment(this.state.eventStart).format('MM/DD/YYYY');
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
        <td><Link to={`/events/${id}`}>{name}</Link></td>
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
