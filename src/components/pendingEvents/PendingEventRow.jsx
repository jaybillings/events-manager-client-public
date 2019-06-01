import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {diffListings, renderOptionList, renderSchemaLink} from "../../utilities";

import PendingListingRow from '../PendingListingRow';
import StatusLabel from "../common/StatusLabel";

/**
 * PendingEventRow displays a single row in a pending event table.
 *
 * @class
 * @child
 */
export default class PendingEventRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.startRef = React.createRef();
    this.endRef = React.createRef();
    this.venueRef = React.createRef();
    this.orgRef = React.createRef();
  }

  /**
   * `handleSaveClick` handles the save button click by parsing the new data
   * and triggering the update function.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.nameRef.current.value,
      start_date: Moment(this.startRef.current.value).valueOf(),
      end_date: Moment(this.endRef.current.value).valueOf(),
      venue_uuid: this.venueRef.current.value,
      org_uuid: this.orgRef.current.value
    };

    this.props.updateListing(this.props.listing, newData)
      .then(() => this.setState({editable: false}));
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const listingID = this.props.listing.id;
    const listingName = this.props.listing.name;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const writeStatus = this.state.writeStatus;

    const venueUUID = this.props.listing.venue_uuid || '';
    const orgUUID = this.props.listing.org_uuid || '';
    const createdAt = Moment(this.props.listing.created_at).calendar();
    const selectClass = this.props.selected ? ' is-selected' : '';

    if (this.state.editable) {
      const startDateVal = Moment(this.props.listing.start_date).format('YYYY-MM-DD');
      const endDateVal = Moment(this.props.listing.end_date).format('YYYY-MM-DD');

      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input ref={this.nameRef} type={'text'} name={'listingName'} defaultValue={listingName}
                     onClick={e => e.stopPropagation()} /></td>
          <td><input ref={this.startRef} type={'date'} name={'listingStart'} defaultValue={startDateVal}
                     onClick={e => e.stopPropagation()} /></td>
          <td><input ref={this.endRef} type={'date'} name={'listingEnd'} defaultValue={endDateVal}
                     onClick={e => e.stopPropagation()} /></td>
          <td>
            <select ref={this.venueRef} name={'linkedVenueUUID'} defaultValue={venueUUID}
                    onClick={e => e.stopPropagation()}>
              {renderOptionList(venues, 'venues', 'uuid')}
            </select>
          </td>
          <td><select ref={this.orgRef} name={'linkedOrgUUID'} defaultValue={orgUUID} onClick={e => e.stopPropagation()}
                      required>
            {renderOptionList(orgs, 'organizers', 'uuid')}
          </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'events'} /></td>
        </tr>
      );
    }

    const startDate = Moment(this.props.listing.start_date).format('MM/DD/YYYY');
    const endDate = Moment(this.props.listing.end_date).format('MM/DD/YYYY');
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
