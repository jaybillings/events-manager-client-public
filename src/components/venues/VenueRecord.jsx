import React, {Component} from "react";
import Moment from "moment";
import {renderOptionList} from "../../utilities";

import '../../styles/schema-record.css';

export default class VenueRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();
    this.hoodList = React.createRef();
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

  handleClickDelete() {
    const id = this.props.venue.id;
    this.props.deleteListing(id);
  }

  handleSubmit(e) {
    e.preventDefault();

    const venue = this.props.venue;
    const id = venue.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_id: this.hoodList.current.value,
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have a value
    (this.emailInput.current.value !== venue.email) && (newData.email = this.emailInput.current.value);
    (this.urlInput.current.value !== venue.url) && (newData.url = this.urlInput.current.value);
    (this.phoneInput.current.value !== venue.phone) && (newData.phone = this.phoneInput.current.value);
    (this.streetInput.current.value !== venue.address_street) && (newData.address_street = this.streetInput.current.value);
    (this.cityInput.current.value !== venue.address_city) && (newData.address_city = this.cityInput.current.value);
    (this.stateInput.current.value !== venue.address_state) && (newData.address_state = this.stateInput.current.value);
    (this.zipInput.current.value !== venue.address_zip) && (newData.address_zip = this.zipInput.current.value);

    this.props.saveVenue(id, newData);
  }

  render() {
    const venue = this.props.venue;
    const hoods = this.props.hoods;
    const createdAt = Moment(venue['created_at']).calendar();
    const updatedAt = Moment(venue['updated_at']).calendar();

    return (
      <form id={'venue-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          ID
          <input type={'text'} value={venue.id} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={venue.name} required maxLength={100}/>
        </label>
        <label className={'required'}>
          Neighborhood
          <select ref={this.hoodList} defaultValue={venue.hood_id || ''} required>{renderOptionList(hoods)}</select>
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={venue.description} required maxLength={500}/>
        </label>
        <label>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={venue.email} maxLength={100}/>
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} defaultValue={venue.url} maxLength={100}/>
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
          <input type={'text'} ref={this.cityInput} defaultValue={venue.address_city} maxLength={50}/>
        </label>
        <label>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={venue.address_state} maxLength={50}/>
        </label>
        <label>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={venue.address_zip} maxLength={20}/>
        </label>
        <div>
          <button type={'button'} onClick={this.handleClickDelete}>Delete Venue</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
