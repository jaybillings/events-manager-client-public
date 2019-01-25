import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * OrganizerRecord is a component which displays a single organizer's records.
 * @class
 * @child
 */
export default class OrganizerRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new organizer.
   * @override
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      description: this.descInput.current.value
    };

    // Optional data -- only include if set (prevents validation errors)
    this.urlInput.current.value && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value && (newData.phone = this.phoneInput.current.value);

    this.props.updateListing(newData);
  }

  /**
   * Renders the component.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const org = this.props.listing;
    const createdAt = Moment(org.created_at).calendar();
    const updatedAt = Moment(org.updated_at).calendar();
    const deleteButton = this.user.is_admin ?
      <button type={'button'} onClick={this.handleDeleteClick}>Delete Organizer</button> : '';

    return (
      <form id={'organizer-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={org.uuid} readOnly />
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
          <input type={'text'} ref={this.nameInput} defaultValue={org.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={org.description} required maxLength={500} />
        </label>
        <label>
          URL
          <input type={'text'} ref={this.urlInput} defaultValue={org.url} maxLength={100} />
        </label>
        <label>
          Phone Number
          <input type={'text'} ref={this.phoneInput} defaultValue={org.phone} maxLength={20} />
        </label>
        <div>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          {deleteButton}
        </div>
      </form>
    );
  }
};
