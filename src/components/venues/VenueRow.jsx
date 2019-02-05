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
   * @param {object} props
   */
  constructor(props) {
    super(props);

    const hoodID = typeof this.props.hood === 'undefined' ? '' : this.props.hood.id;

    Object.assign(this.state, {venueHood: hoodID});
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the event.
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      uuid: this.props.listing.uuid,
      name: this.state.listingName,
      hood_id: this.state.venueHood
    };

    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.setState({editable: false});
    });
  }

  handleCopyClick(e) {
    e.stopPropagation();

    let {id, hood_id, ...venueData} = this.props.listing;
    venueData.hood_uuid = this.props.hood.uuid;

    this.props.createPendingListing(venueData).then(() => {
      this.listingHasPending();
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
    const id = this.props.listing.id;
    const name = this.state.listingName;
    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      const defaultHood = this.state.venueHood || this.props.hoods[0].uuid;

      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td><select name={'venueHood'} value={defaultHood}
                      onChange={this.handleInputChange}>{renderOptionList(this.props.hoods)}</select></td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    const hoodNameLink = this.props.hood
      ? <Link to={`/neighborhoods/${this.props.hood.id}`}>{this.props.hood.name}</Link> : 'NO NEIGHBORHOOD';
    const deleteButton = this.user.is_admin
      ? <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button> : '';

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
