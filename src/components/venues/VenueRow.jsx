import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";

/**
 * VenueROw is a component which displays a single row for a live venue table.
 *
 * @class
 * @child
 */
export default class VenueRow extends ListingRow {
  /**
   * The component's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    const hoodUUID = typeof this.props.hood === 'undefined' ? '' : this.props.hood.uuid;

    this.state = {venueName: this.props.listing.name, venueHood: hoodUUID, editable: false}
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the event.
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      uuid: this.props.listing.uuid,
      name: this.state.venueName,
      hood_uuid: this.state.venueHood
    };

    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.setState({editable: false});
    });
  }

  /**
   * Renders the component.
   * @note The render has two different paths depending on whether the row can be edited.
   *
   * @render
   * @returns {*}
   */
  render() {
    const venue = this.props.listing;
    const hoods = this.props.hoods;
    const updatedAt = Moment(venue['updated_at']).calendar();

    const defaultHood = this.state.venueHood || this.props.hoods[0].uuid;

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'venueName'} value={venue.name} onChange={this.handleInputChange} /></td>
          <td><select name={'venueHood'} value={defaultHood}
                      onChange={this.handleInputChange}>{renderOptionList(hoods)}</select></td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    const hoodNameLink = this.props.hood
      ? <Link to={`/neighborhoods/${this.props.hood.id}`}>{ this.props.hood.name }</Link> : 'NO NEIGHBORHOOD';

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button>
        </td>
        <td><Link to={`/venues/${venue.id}`}>{venue.name}</Link></td>
        <td>{hoodNameLink}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
