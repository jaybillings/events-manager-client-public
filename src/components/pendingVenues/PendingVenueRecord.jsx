import React, {Component} from "react";
import Moment from "moment";
import {renderOptionList} from "../../utilities";

import '../../styles/schema-record.css';

export default class PendingVenueRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();
    this.hoodInput = React.createRef();
    this.descInput = React.createRef();
    this.emailInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
    this.streetInput = React.createRef();
    this.cityInput = React.createRef();
    this.stateInput = React.createRef();
    this.zipInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const pendingVenue = this.props.pendingVenue;
    const id = pendingVenue.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_id: this.hoodInput.current.value,
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have value
    (this.emailInput.current.value !== pendingVenue.email) && (newData.email = this.emailInput.current.value.trim());
    (this.urlInput.current.value !== pendingVenue.url) && (newData.url = this.urlInput.current.value.trim());
    (this.phoneInput.current.value !== pendingVenue.phone) && (newData.phone = this.phoneInput.current.value.trim());
    (this.streetInput.current.value !== pendingVenue.address_street) && (newData.address_street = this.streetInput.current.value.trim());
    (this.cityInput.current.value !== pendingVenue.address_city) && (newData.address_city = this.cityInput.current.value.trim());
    (this.stateInput.current.value !== pendingVenue.address_state) && (newData.address_state = this.stateInput.current.value.trim());
    (this.zipInput.current.value !== pendingVenue.address_zip) && (newData.address_zip = this.zipInput.current.value.trim());

    this.props.saveVenue(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingVenue.id;
    this.props.deleteVenue(id);
  }

  render() {
    const pendingVenue = this.props.pendingVenue;
    const venueId = pendingVenue.target_id || 'N/A';
    const hoods = this.props.hoods;
    const createdAt = Moment(pendingVenue.created_at).calendar();
    const updatedAt = Moment(pendingVenue.updated_at).calendar();

    return (
      <form id={'pending-venue-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Venue ID
          <input type={'text'} value={venueId} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={pendingVenue.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodInput} defaultValue={pendingVenue.hood_id || ''} required>
            {renderOptionList(hoods)}
          </select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={pendingVenue.description} required maxLength={500} />
        </label>
        <label>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={pendingVenue.email} />
        </label>
        <label>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={pendingVenue.url} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={pendingVenue.phone} />
        </label>
        <label>
          Street Address
          <input type={'text'} ref={this.streetInput} defaultValue={pendingVenue.address_street} />
        </label>
        <label>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={pendingVenue.address_city} />
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={pendingVenue.address_state} />
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={pendingVenue.address_zip} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This venue is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleClickDelete}>Discard Venue</button>
        </div>
      </form>
    );
  }
};
