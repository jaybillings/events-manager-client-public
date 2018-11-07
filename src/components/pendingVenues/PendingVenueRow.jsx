import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList, renderUpdateStatus} from "../../utilities";

import PendingListingRow from "../generic/PendingListingRow";

export default class PendingVenueRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();
  }

  handleSaveClick() {
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_id: this.hoodList.current.value
    };

    this.props.saveChanges(this.props.pendingListing.id, newData);
    this.setState({editable: false});
  }

  render() {
    const pendingListing = this.props.pendingListing;
    const neighborhoods = this.props.neighborhoods;
    const isDup = this.state.is_dup;
    const isNew = this.state.is_new;

    const hoodLink = this.props.neighborhood
      ? <Link to={`/pendingNeighborhoods/${this.props.neighborhood.id}`}>{this.props.neighborhood.name}</Link>
      : 'NO NEIGHBORHOOD';
    const createdAt = Moment(pendingListing.created_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} />
          </td>
          <td>
            <select ref={this.hoodList} defaultValue={pendingListing.hood_id || ''} required>
              {renderOptionList(neighborhoods)}
            </select>
          </td>
          <td>{createdAt}</td>
          <td>{renderUpdateStatus(isDup, isNew, 'venue')}</td>
        </tr>
      );
    }

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingListing.id}`}>{pendingListing.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
        <td>{renderUpdateStatus(isDup, isNew, 'venue')}</td>
      </tr>
    );
  }
};
