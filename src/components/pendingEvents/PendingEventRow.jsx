import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList} from "../../utilities";

import PendingListingRow from '../PendingListingRow';
import StatusLabel from "../common/StatusLabel";

export default class PendingEventRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.venueList = React.createRef();
    this.orgList = React.createRef();
  }

  handleSaveClick() {
    const id = this.props.pendingListing.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueList.current.value,
      org_id: this.orgList.current.value
    };

    this.props.saveChanges(id, newData);
    this.setState({editable: false});
  }

  render() {
    const pendingListing = this.props.pendingListing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const isDup = this.state.is_dup;
    const isNew = this.state.is_new;
    const selectClass = selected ? ' is-selected' : '';

    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const venueLink = this.props.venue ?
      <Link to={`/venues/${pendingListing.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.org ?
      <Link to={`/organizers/${pendingListing.org_id}`}>{this.props.org.name}</Link> : 'NO ORGANIZER';

    const startDate = Moment(pendingListing.start_date).format('MM/DD/YYYY');
    const startDateVal = Moment(pendingListing.start_date).format('YYYY-MM-DD');
    const endDate = Moment(pendingListing.end_date).format('MM/DD/YYYY');
    const endDateVal = Moment(pendingListing.end_date).format('YYYY-MM-DD');

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} /></td>
          <td><input type={'date'} ref={this.startInput} defaultValue={startDateVal} /></td>
          <td><input type={'date'} ref={this.endInput} defaultValue={endDateVal} /></td>
          <td><select ref={this.venueList} defaultValue={pendingListing.venue_id || ''}>{renderOptionList(venues)}</select></td>
          <td><select ref={this.orgList} defaultValue={pendingListing.org_id || ''}>{renderOptionList(orgs)}</select></td>
          <td>{createdAt}</td>
          <td><StatusLabel isNew={isNew} isDup={isDup} schema={'events'} /></td>
        </tr>
      );
    }

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingEvents/${pendingListing.id}`}>{pendingListing.name}</Link></td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel isNew={isNew} isDup={isDup} schema={'events'} /></td>
      </tr>
    );
  }
};
