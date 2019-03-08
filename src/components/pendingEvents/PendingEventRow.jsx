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

    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.venueList = React.createRef();
    this.orgList = React.createRef();
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the pending event.
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_uuid: this.venueList.current.value,
      org_uuid: this.orgList.current.value
    };

    console.log('newData', newData);

    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.checkWriteStatus();
      this.setState({editable: false});
    });
  }

  /**
   * Renders the component.
   * @note The render has two different paths depending on whether the row can be edited.
   * @render
   * @returns {*}
   */
  render() {
    const pendingListing = this.props.listing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const writeStatus = this.state.writeStatus;
    const selectClass = selected ? ' is-selected' : '';

    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const startDate = Moment(pendingListing.start_date).format('MM/DD/YYYY');
    const startDateVal = Moment(pendingListing.start_date).format('YYYY-MM-DD');
    const endDate = Moment(pendingListing.end_date).format('MM/DD/YYYY');
    const endDateVal = Moment(pendingListing.end_date).format('YYYY-MM-DD');

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} ref={this.startInput} defaultValue={startDateVal} onClick={e => e.stopPropagation()} /></td>
          <td><input type={'date'} ref={this.endInput} defaultValue={endDateVal} onClick={e => e.stopPropagation()} /></td>
          <td>
            <select ref={this.venueList} defaultValue={pendingListing.venue_uuid || ''} onClick={e => e.stopPropagation()}>
              {renderOptionList(venues, 'venues', 'uuid')}
            </select>
          </td>
          <td><select ref={this.orgList} defaultValue={pendingListing.org_uuid || ''} onClick={e => e.stopPropagation()} required>
            {renderOptionList(orgs, 'orgs', 'uuid')}
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
        <td><Link to={`/pendingEvents/${pendingListing.id}`}>{pendingListing.name}</Link></td>
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
