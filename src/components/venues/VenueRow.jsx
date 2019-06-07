import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";

/**
 * VenueRow is a component which displays a single row for a live venue table.
 * @class
 * @child
 */
export default class VenueRow extends ListingRow {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param {{schema: String, listing: Object, hood: Object, hoods: Array, updateListing: Function, deleteListing: Function, createPendingListing: Function, queryForMatching: Function}} props
   */
  constructor(props) {
    super(props);

    const linkedHoodUUID = this.props.hood ? this.props.hood.uuid : (this.props.hoods[0] ? this.props.hoods[0].uuid : null);

    this.state = {...this.state, linkedHoodUUID};
  }

  /**
   * `handleSaveClick` runs when the save button is clicked. It initiates the saving of the row's data.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {name: this.state.listingName, hood_uuid: this.state.linkedHoodUUID};

    this.props.updateListing(this.props.listing, newData).then(() => {
      this.setState({editable: false});
    });
  }

  /**
   * `handleCopyClick` runs whn the copy button is clicked. It initiates the creation of a pending
   * listing from the published listing's data.
   *
   * @param {Event} e
   */
  handleCopyClick(e) {
    e.stopPropagation();

    // noinspection JSUnusedLocalSymbols
    let {id, hood_id, ...venueData} = this.props.listing;

    venueData.hood_uuid = this.props.hood.uuid;
    venueData.created_at = Moment(venueData.created_at).valueOf();
    venueData.updated_at = Moment(venueData.updated_at).valueOf();

    this.props.createPendingListing(venueData).then(result => {
      this.setState({matchingPendingListing: result});
    });
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const id = this.props.listing.id;
    const name = this.state.listingName;
    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} className={'emphasize more'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td>
            <select name={'linkedHoodUUID'} value={this.state.linkedHoodUUID} onChange={this.handleInputChange}>
              {renderOptionList(this.props.hoods, 'neighborhoods')}
            </select>
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    const hoodNameLink = this.props.hood
      ? <Link to={`/neighborhoods/${this.props.hood.id}`}>{this.props.hood.name}</Link> : 'NO NEIGHBORHOOD';
    const deleteButton = this.user.is_admin
      ? <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete</button> : '';

    return (
      <tr className={'schema-row'}>
        <td>
          {this.renderEditButton()}
          {deleteButton}
        </td>
        <td><Link to={`/venues/${id}`}>{name}</Link></td>
        <td>{hoodNameLink}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
