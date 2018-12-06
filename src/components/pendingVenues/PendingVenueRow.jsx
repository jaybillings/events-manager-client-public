import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList, renderSchemaLink} from "../../utilities";

import PendingListingRow from "../PendingListingRow";
import StatusLabel from "../common/StatusLabel";

export default class PendingVenueRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();
  }

  handleSaveClick(e) {
    e.stopPropagation();

    const id = this.props.pendingListing.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_uuid: this.hoodList.current.value
    };

    this.props.saveChanges(id, newData).then(result => {
      this.checkWriteStatus(result);
      this.setState({editable: false});
    });
  }

  render() {
    const pendingListing = this.props.pendingListing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const writeStatus = this.state.write_status;
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
          <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
        </tr>
      );
    }

    const hoodLink = this.props.hood ? renderSchemaLink(this.props.hood, 'neighborhoods') : 'NO NEIGHBORHOOD';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingListing.uuid}`}>{pendingListing.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
      </tr>
    );
  }
};
