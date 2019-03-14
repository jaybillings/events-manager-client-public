import React from "react";
import Moment from "moment";
import {renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingVenueRecord is a component which displays a single pending venue's record.
 * @class
 * @child
 */
export default class PendingVenueRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{listing: Object, schema: String, hoods: Array, updateListing: Function, deleteListing: Function, queryForExisting: Function}} props
   */
  constructor(props) {
    super(props);

    this.hoodInput = React.createRef();
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
   * Runs after the component mounts. Checks for write status of listing.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new pending venue.
   * @override
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      hood_uuid: this.hoodInput.current.value,
      description: this.descInput.current.value
    };

    // Only add non-required if they have value
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
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const venue = this.props.listing;
    const hoods = this.props.hoods;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(venue.created_at).calendar();
    const updatedAt = Moment(venue.updated_at).calendar();

    return (
      <form id={'pending-venue-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-events'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={venue.uuid} readOnly />
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
        <label className={'required-ish'}>
          Neighborhood
          <select ref={this.hoodInput} defaultValue={venue.hood_uuid || ''} required>
            {renderOptionList(hoods, 'neighborhoods', 'uuid')}
          </select>
        </label>
        <label className={'required-ish'}>
          Description
          <textarea ref={this.descInput} defaultValue={venue.description} required maxLength={500} />
        </label>
        <label>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={venue.email} />
        </label>
        <label>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={venue.url} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={venue.phone} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={this.streetInput} defaultValue={venue.address_street} />
        </label>
        <label>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={venue.address_city} />
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={venue.address_state} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={venue.address_zip} />
        </label>
        <div>
          <button type={'button'} className={'default'} onClick={this.handleDeleteClick}>Discard Venue</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
