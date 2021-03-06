import React from 'react';
import {renderOptionList} from '../../utilities';

import ListingAddForm from "../ListingAddForm";

/**
 * `VenueAddForm` displays a form for adding new venues.
 *
 * @class
 * @child
 * @param {{schema: String, hoods: Array, createListing: Function, createPendingListing: Function}} props
 */
export default class VenueAddForm extends ListingAddForm {
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
   * `buildNewListing` compiles data for creating a new listing.
   *
   * @override
   * @returns {*}
   */
  buildNewListing() {
    const venueObj = {
      name: this.nameInput.current.value,
      description: this.descInput.current.value,
      hood_uuid: this.hoodList.current.value || this.props.hoods[0].uuid
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
   * `clearForm` clears the add form by resetting the input values.
   *
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
    const submitAction = this.user.is_su ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_su ? 'Publish Venue' : 'Add Pending Venue';

    return (
      <form id={'venue-add-form'} className={'add-form'} onSubmit={submitAction}>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodList} defaultValue={defaultHood}>
            {renderOptionList(this.props.hoods, 'neighborhoods', 'uuid')}
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
          <input type={'text'} ref={this.urlInput} />
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
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
