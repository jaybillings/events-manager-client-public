import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList, renderSchemaLink} from "../../utilities";

import PendingListingRow from "../PendingListingRow";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingVenueRow is a component which displays a single row from a pending venues table.
 * @class
 * @child
 */
export default class PendingVenueRow extends PendingListingRow {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param {{schema: String, listing: Object, selected: Boolean, hoods: Array, hood: Object, updateListing: Function, removeListing: Function, selectListing: Function, queryForExisting: Function}} props
   */
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the venue.
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_uuid: this.hoodList.current.value
    };

    this.props.updateListing(this.props.listing.id, newData).then(result => {
      this.checkWriteStatus(result);
      this.setState({editable: false});
    });
  }

  /**
   * Renders the component.
   * @note The render has two different paths depending on whether the row can be edited.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const pendingListing = this.props.listing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const writeStatus = this.state.writeStatus;
    const selectClass = selected ? ' is-selected' : '';
    const hoods = this.props.hoods;

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name}
                     onClick={e => e.stopPropagation()} /></td>
          <td>
            <select ref={this.hoodList} defaultValue={pendingListing.hood_uuid || ''} onClick={e => e.stopPropagation()}
                    required>
              {renderOptionList(hoods, 'uuid')}
            </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
        </tr>
      );
    }

    /** @var {object} this.props.hood */
    const hoodLink = this.props.hood ? renderSchemaLink(this.props.hood, 'neighborhoods') : 'NO NEIGHBORHOOD';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingListing.id}`}>{pendingListing.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
      </tr>
    );
  }
};
