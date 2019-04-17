import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList, renderSchemaLink} from "../../utilities";

import PendingListingRow from '../PendingListingRow';
import StatusLabel from "../common/StatusLabel";

/**
 * PendingEventRow is a component which displays a single row for a pending event table.
 * @class
 * @child
 */
export default class PendingEventRow extends PendingListingRow {
  /**
   * The component's constructor.
   *
   * @param {{selected: Boolean, schema: String, listing: Object, venues: Array, orgs: Array, venue: Object, org: Object, updateListing: Function, removeListing: Function, selectListing: Function, queryForExisting: Function}} props
   */
  constructor(props) {
    super(props);

    Object.assign(this.state, {
      listingName: this.props.listing.name, listingStart: this.props.listing.start_date,
      listingEnd: this.props.listing.end_date, linkedVenueUUID: this.props.venue.uuid,
      linkedOrgUUID: this.props.org.uuid
    });
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the pending event.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.state.listingName,
      start_date: Moment(this.state.listingStart).valueOf(),
      end_date: Moment(this.state.listingEnd).valueOf(),
      venue_uuid: this.state.linkedVenueUUID,
      org_uuid: this.state.linkedOrgUUID
    };

    this.props.updateListing(this.props.listing, newData).then(() => {
      this.checkWriteStatus();
      this.setState({editable: false});
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
    const writeStatus = this.state.writeStatus;
    const venues = this.props.venues;
    const orgs = this.props.orgs;

    const createdAt = Moment(this.props.listing.created_at).calendar();
    const selectClass = this.props.selected ? ' is-selected' : '';


    const startDate = Moment(this.state.listingStart).format('MM/DD/YYYY');
    const startDateVal = Moment(this.state.listingStart).format('YYYY-MM-DD');
    const endDate = Moment(this.state.listingEnd).format('MM/DD/YYYY');
    const endDateVal = Moment(this.state.listingEnd).format('YYYY-MM-DD');

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={listingName} onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} name={'listingStart'} value={startDateVal} onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} name={'listingEnd'} value={endDateVal} onClick={e => e.stopPropagation()} /></td>
          <td>
            <select name={'linkedVenueUUID'} value={venueUUID} onClick={e => e.stopPropagation()}>
              {renderOptionList(venues, 'venues', 'uuid')}
            </select>
          </td>
          <td><select name={'linkedOrgUUID'} value={orgUUID} onClick={e => e.stopPropagation()} required>
            {renderOptionList(orgs, 'organizers', 'uuid')}
          </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'events'} /></td>
        </tr>
      );
    }

    const venueLink = this.props.venue ? renderSchemaLink(this.props.venue, 'venues') : 'NO VENUE';
    const orgLink = this.props.org ? renderSchemaLink(this.props.org, 'organizers') : 'NO ORGANIZER';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingEvents/${listingID}`}>{listingName}</Link></td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'events'} /></td>
      </tr>
    );
  }
};
