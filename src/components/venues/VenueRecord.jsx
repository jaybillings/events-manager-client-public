import React from "react";
import Moment from "moment";
import {renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * `VenueRecord` displays a single venue's record.
 *
 * @class
 * @child
 */
export default class VenueRecord extends ListingRecordUniversal {
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
   * `handleSaveClick` runs on submit. It parses new data and initiates a save.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      hood_uuid: this.hoodList.current.value,
      description: this.descInput.current.value
    };

    // Optional data -- only include if set
    this.emailInput.current.value !== '' && (newData.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value);
    this.streetInput.current.value !== '' && (newData.address_street = this.streetInput.current.value);
    this.cityInput.current.value !== '' && (newData.address_city = this.cityInput.current.value);
    this.stateInput.current.value !== '' && (newData.address_state = this.stateInput.current.value);
    this.zipInput.current.value !== '' && (newData.address_zip = this.zipInput.current.value);

    this.props.updateListing(newData);
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

    const publishButton = this.user.is_su
      ? <button type={'submit'} className={'button-primary'}>Save Changes</button> : '';
    const deleteButton = this.user.is_admin ?
      <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete Venue</button> : '';
    const disableAll = !this.user.is_su;

    return (
      <form id={'venue-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <label>
          UUID
          <input type={'text'} value={venue.uuid} readOnly />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} readOnly />
        </label>
        <label>
          Last Updated
          <input type={'text'} value={updatedAt} readOnly />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={venue.name} disabled={disableAll} required
                 maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodList} defaultValue={venue.hood_uuid || ''} disabled={disableAll} required>
            {renderOptionList(hoods, 'neighborhoods', 'uuid')}
          </select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={venue.description} disabled={disableAll} required
                    maxLength={500} />
        </label>
        <label>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={venue.email} maxLength={50} disabled={disableAll} />
        </label>
        <label>
          URL
          <input type={'text'} ref={this.urlInput} defaultValue={venue.url} maxLength={100} disabled={disableAll} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} defaultValue={venue.phone} maxLength={20} disabled={disableAll} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={this.streetInput} defaultValue={venue.address_street} maxLength={100}
                 disabled={disableAll} />
        </label>
        <label>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={venue.address_city} maxLength={50}
                 disabled={disableAll} />
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={venue.address_state} maxLength={50}
                 disabled={disableAll} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={venue.address_zip} maxLength={20}
                 disabled={disableAll} />
        </label>
        <div>
          {deleteButton}
          {publishButton}
        </div>
      </form>
    );
  }
};
