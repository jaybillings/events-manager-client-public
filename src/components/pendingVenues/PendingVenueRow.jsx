import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList} from "../../utilities";

import PendingListingRow from "../PendingListingRow";
import StatusLabel from "../common/StatusLabel";

export default class PendingVenueRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();

    PendingVenueRow.renderHoodLink = PendingVenueRow.renderHoodLink.bind(this);
  }

  handleSaveClick() {
    const id = this.props.pendingListing.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_uuid: this.hoodList.current.value
    };

    this.props.saveChanges(id, newData).then(result => {
      // noinspection JSCheckFunctionSignatures
      Promise.all([this.checkIfDup(result), this.checkIfNew(result)]).then(() => {
        this.setState({editable: false});
      });
    });
  }

  static renderHoodLink(hood) {
    let linkString;

    if (hood.source === 'pending') {
      linkString = `/pendingNeighborhoods/${hood.uuid}`;
    } else if (hood.source === 'live') {
      linkString = `/neighborhoods/${hood.uuid}`;
    } else {
      linkString = '/404';
    }

    return <Link to={linkString}>{hood.name}</Link>;
  }

  render() {
    const pendingListing = this.props.pendingListing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const isDup = this.state.is_dup;
    const isNew = this.state.is_new;
    const selectClass = selected ? ' is-selected' : '';
    const hoods = this.props.hoods;

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} /></td>
          <td>
            <select ref={this.hoodList} defaultValue={pendingListing.hood_id || ''} required>
              {renderOptionList(hoods)}
            </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel isDup={isDup} isNew={isNew} schema={'venues'}/></td>
        </tr>
      );
    }

    const hoodLink = this.props.hood ? PendingVenueRow.renderHoodLink(this.props.hood) : 'NO NEIGHBORHOOD';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingListing.uuid}`}>{pendingListing.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel isDup={isDup} isNew={isNew} schema={'venues'}/></td>
      </tr>
    );
  }
};
