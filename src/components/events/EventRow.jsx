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
   * @param {object} props
   */
  constructor(props) {
    super(props);

    const event = this.props.listing;
    const venueUUID = typeof this.props.venue === 'undefined' ? '' : this.props.venue.uuid;
    const orgUUID = typeof this.props.org === 'undefined' ? '' : this.props.org.uuid;

    Object.assign(this.state, {
      is_published: false, eventStart: event.start_date, eventEnd: event.end_date,
      eventVenue: venueUUID, eventOrg: orgUUID
    });

    this.listingIsLive = this.listingIsLive.bind(this);
  }

  /**
   * Runs once the component mounts. Checks the live status of the event.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();
    this.listingIsLive();
  }

  /**
   * Determines whether the event is live by triggering a function to query the live service for the event's
   * presence.
   */
  listingIsLive() {
    this.props.checkForLive(this.props.listing.id).then(results => {
      this.setState({is_published: results.total > 0});
    }, err => {
      console.log('error in checking for live', JSON.stringify(err));
    });
  };

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
      end_date: Moment(this.state.eventStart).valueOf(),
      venue_uuid: this.state.eventVenue,
      org_uuid: this.state.eventOrg
    };

    this.props.updateListing(this.props.listing.id, {newData: newData, doPublish: this.state.is_published}).then(() => {
      this.setState({editable: false});
    });
  }

  /**
   * Handles the copy button click by parsing the listing data and triggering a function to create a pending
   * event with the parsed data.
   */
  handleCopyClick() {
    let pendingListingData = Object.assign({
      org_uuid: this.props.org.uuid || null,
      venue_uuid: this.props.venue.uuid || null
    }, this.props.listing);

    delete (pendingListingData.org_id);
    delete (pendingListingData.venue_id);

    this.props.copyAsPending(pendingListingData).then(() => {
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
      const defaultVenue = this.state.eventVenue || this.props.venues[0].uuid;
      const defaultOrg = this.state.eventOrg || this.props.orgs[0].uuid;

      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'submit'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventStart'} value={startDateVal} onChange={this.handleInputChange} /></td>
          <td><input type={'date'} name={'eventEnd'} value={endDateVal} onChange={this.handleInputChange} /></td>
          <td><select name={'eventVenue'} value={defaultVenue}
                      onChange={this.handleInputChange}>{renderOptionList(this.props.venues)}</select></td>
          <td><select name={'eventOrg'} value={defaultOrg}
                      onChange={this.handleInputChange}>{renderOptionList(this.props.orgs)}</select></td>
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
      <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button> : '';

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
