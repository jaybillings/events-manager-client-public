import React from 'react';
import {renderOptionList} from '../../utilities';

import ListingAddForm from "../ListingAddForm";

/**
 * VenueAddForm is a component which displays a form for adding new venues.
 * @class
 * @child
 */
export default class VenueAddForm extends ListingAddForm {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {{schema: String, hoods: Array, createListing: Function, createPendingListing: Function}} props
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

    this.buildPendingListing = this.buildPendingListing.bind(this);
  }

  /**
   * Handles the submit action by triggering the creation of a new pending listing.
   *
   * @param {Event} e
   */
  handleAddPendingClick(e) {
    e.preventDefault();
    const listingData = this.buildPendingListing();
    this.props.createPendingListing(listingData);
  }

  /**
   * Compiles the data required for creating a new listing.
   * @override
   *
   * @returns {Object}
   */
  buildNewListing() {
    const venueObj = {
      name: this.nameInput.current.value,
      description: this.descInput.current.value,
      hood_id: parseInt(this.hoodList.current.value, 10) || this.props.hoods[0].id
    };

    // Optional data
    this.emailInput.current.value !== '' && (venueObj.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (venueObj.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (venueObj.phone = this.phoneInput.current.value);
    this.streetInput.current.value !== '' && (venueObj.address_street = this.streetInput.current.value);
    this.cityInput.current.value !== '' && (venueObj.address_city = this.cityInput.current.value);
    this.stateInput.current.value !== '' && (venueObj.address_state = this.stateInput.current.value);
    this.zipInput.current.value !== '' && (venueObj.address_zip = this.zipInput.current.value);

    return venueObj;
  }

  /**
   * Compiles the data required for creating a new pending listing.
   *
   * @returns {Object}
   */
  buildPendingListing() {
    const venueObj = {
      name: this.nameInput.current.value,
      description: this.descInput.current.value
    };

    // Linked schema
    const venueHood = this.props.hoods.find(hood => {
      return hood.id === parseInt(this.hoodList.current.value, 10)
    });
    venueObj.hood_uuid = venueHood.uuid || this.props.hoods[0].uuid;

    // Optional data
    this.emailInput.current.value !== '' && (venueObj.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (venueObj.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (venueObj.phone = this.phoneInput.current.value);
    this.streetInput.current.value !== '' && (venueObj.address_street = this.streetInput.current.value);
    this.cityInput.current.value !== '' && (venueObj.address_city = this.cityInput.current.value);
    this.stateInput.current.value !== '' && (venueObj.address_state = this.stateInput.current.value);
    this.zipInput.current.value !== '' && (venueObj.address_zip = this.zipInput.current.value);

    return venueObj;
  }

  /**
   * Clears the form by setting all fields to a default or empty value.
   * @override
   */
  clearForm() {
    this.nameInput.current.value = '';
    this.hoodList.current.value = this.hoodList.current.firstChild.value;
    this.descInput.current.value = '';
    this.emailInput.current.value = '';
    this.urlInput.current.value = '';
    this.phoneInput.current.value = '';
    this.streetInput.current.value = '';
    this.cityInput.current.value = 'Seattle';
    this.stateInput.current.value = 'Washington';
    this.zipInput.current.value = '';
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const defaultHood = this.props.hoods.length > 0 ? this.props.hoods[0].id : '';
    const submitAction = this.user.is_admin ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_admin ? 'Publish Venue' : 'Add Pending Venue';

    return (
      <form id={'venue-add-form'} className={'add-form'} onSubmit={submitAction}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodList} defaultValue={defaultHood}>
            {renderOptionList(this.props.hoods, 'neighborhoods')}
          </select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} required maxLength={500} />
        </label>
        <label>
          Email Address
          <input type={'email'} ref={this.emailInput} />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={this.streetInput} />
        </label>
        <label>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={'Seattle'} />
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={'Washington'} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
