import React from "react";
import Moment from "moment";
import {renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * VenueRecord is a component that displays a single venue's record.
 * @class
 * @child
 */
export default class VenueRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();
    this.descInput = React.createRef();
    this.emailInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
    this.streetInput = React.createRef();
    this.cityInput = React.createRef();
    this.stateInput = React.createRef();
    this.zipInput = React.createRef();
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new venue.
   *
   * @override
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      hood_id: parseInt(this.hoodList.current.value, 10),
      description: this.descInput.current.value,
      email: this.emailInput.current.value,
      url: this.urlInput.current.value,
      phone: this.phoneInput.current.value,
      address_street: this.streetInput.current.value,
      address_city: this.cityInput.current.value,
      address_state: this.stateInput.current.value,
      address_zip: this.zipInput.current.value
    };

    this.props.updateListing(this.props.listing.id, newData);
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const venue = this.props.listing;
    const hoods = this.props.hoods;
    const createdAt = Moment(venue.created_at).calendar();
    const updatedAt = Moment(venue.updated_at).calendar();

    return (
      <form id={'venue-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={venue.uuid} disabled />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} value={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={venue.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodList} defaultValue={venue.hood_id || ''} required>{renderOptionList(hoods)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={venue.description} required maxLength={500} />
        </label>
        <label>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={venue.email} maxLength={50} />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} defaultValue={venue.url} maxLength={100} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} defaultValue={venue.phone} maxLength={20} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={this.streetInput} defaultValue={venue.address_street} maxLength={100} />
        </label>
        <label>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={venue.address_city} maxLength={50} />
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={venue.address_state} maxLength={50} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={venue.address_zip} maxLength={20} />
        </label>
        <div>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleDeleteClick}>Delete Venue</button>
        </div>
      </form>
    );
  }
};
