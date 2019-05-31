import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {diffListings, renderOptionList, renderSchemaLink} from "../../utilities";

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
   * @param {{schema: String, listing: Object, selected: Boolean, hoods: Array, hood: Object, updateListing: Function, removeListing: Function, selectListing: Function, queryForDuplicate: Function}} props
   */
  constructor(props) {
    super(props);

    Object.assign(this.state, {
      listingName: this.props.listing.name, linkedHoodUUID: this.props.hood ? this.props.hood.uuid : null
    });
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the venue.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.state.listingName,
      hood_uuid: this.state.linkedHoodUUID
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
    const hoodUUID = this.state.linkedHoodUUID || '';
    const createdAt = Moment(this.props.listing.created_at).calendar();
    const writeStatus = this.state.writeStatus;
    const selectClass = this.props.selected ? ' is-selected' : '';
    const hoods = this.props.hoods;

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={listingName} onChange={this.handleInputChange}
                     onClick={e => e.stopPropagation()} /></td>
          <td>
            <select required name={'linkedHoodUUID'} value={hoodUUID} onChange={this.handleInputChange}
                    onClick={e => e.stopPropagation()}>
              {renderOptionList(hoods, 'neighborhoods', 'uuid')}
            </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
        </tr>
      );
    }

    const classNameMap = this.state.matchingLiveListing ? diffListings(this.state.matchingLiveListing, this.props.listing, ['name', 'hood_uuid']) : {};
    const hoodLink = this.props.hood ? renderSchemaLink(this.props.hood, 'neighborhoods') : 'NO NEIGHBORHOOD';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td className={classNameMap['name']}><Link to={`/pendingVenues/${listingID}`}>{listingName}</Link></td>
        <td className={classNameMap['hood_uuid']}>{hoodLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
      </tr>
    );
  }
};
