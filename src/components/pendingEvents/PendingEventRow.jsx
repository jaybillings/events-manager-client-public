import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {diffListings, renderOptionList, renderSchemaLink} from "../../utilities";

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
   * @param {{selected: Boolean, schema: String, listing: Object, venues: Array, orgs: Array, venue: Object, org: Object, updateListing: Function, removeListing: Function, selectListing: Function, queryForDuplicate: Function}} props
   */
  constructor(props) {
    super(props);

    const linkedVenueUUID = this.props.venue ? this.props.venue.uuid : null;
    const linkedOrgUUID = this.props.org ? this.props.org.uuid : null;

    Object.assign(this.state, {
      listingName: this.props.listing.name, listingStart: this.props.listing.start_date,
      listingEnd: this.props.listing.end_date, linkedVenueUUID, linkedOrgUUID
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
      this.getWriteStatus();
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

    if (this.state.editable) {
      const startDateVal = Moment(this.state.listingStart).format('YYYY-MM-DD');
      const endDateVal = Moment(this.state.listingEnd).format('YYYY-MM-DD');

      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={listingName} onChange={this.handleInputChange}
                     onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} name={'listingStart'} value={startDateVal} onChange={this.handleInputChange}
                     onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} name={'listingEnd'} value={endDateVal} onChange={this.handleInputChange}
                     onClick={e => e.stopPropagation()} /></td>
          <td>
            <select name={'linkedVenueUUID'} value={venueUUID} onChange={this.handleInputChange}
                    onClick={e => e.stopPropagation()}>
              {renderOptionList(venues, 'venues', 'uuid')}
            </select>
          </td>
          <td><select name={'linkedOrgUUID'} value={orgUUID} onChange={this.handleInputChange}
                      onClick={e => e.stopPropagation()} required>
            {renderOptionList(orgs, 'organizers', 'uuid')}
          </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'events'} /></td>
        </tr>
      );
    }

    const startDate = Moment(this.state.listingStart).format('MM/DD/YYYY');
    const endDate = Moment(this.state.listingEnd).format('MM/DD/YYYY');
    const venueLink = this.props.venue ? renderSchemaLink(this.props.venue, 'venues') : 'NO VENUE';
    const orgLink = this.props.org ? renderSchemaLink(this.props.org, 'organizers') : 'NO ORGANIZER';
    const classNameMap = this.state.matchingLiveListing ? diffListings(this.state.matchingLiveListing, this.props.listing, ['name', 'start_date', 'end_date', 'venue_uuid', 'org_uuid']) : {};

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td className={classNameMap['name']}><Link to={`/pendingEvents/${listingID}`}>{listingName}</Link></td>
        <td className={classNameMap['start_date']}>{startDate}</td>
        <td className={classNameMap['end_date']}>{endDate}</td>
        <td className={classNameMap['venue_uuid']}>{venueLink}</td>
        <td className={classNameMap['org_uuid']}>{orgLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'events'} /></td>
      </tr>
    );
  }
};
