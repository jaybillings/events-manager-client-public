import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * `OrganizerRecord` displays a single organizer's records.
 *
 * @class
 * @child
 */
export default class OrganizerRecord extends ListingRecordUniversal {
  constructor(props) {
    super(props);

    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
  }

  /**
   * `handleSaveClick` runs on submit. Parses new data and initiates a save.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
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
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const org = this.props.listing;
    const createdAt = Moment(org.created_at).calendar();
    const updatedAt = Moment(org.updated_at).calendar();

    const publishButton = this.user.is_su ?
      <button type={'submit'} className={'button-primary'}>Save Changes</button> : '';
    const deleteButton = this.user.is_su ?
      <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>permanently Delete Organizer</button> : '';
    const disableAll = !this.user.is_su;

    return (
      <form id={'organizer-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
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
          <input type={'text'} ref={this.nameInput} defaultValue={org.name} maxLength={100} disabled={disableAll} required />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={org.description} maxLength={500} disabled={disableAll} required  />
        </label>
        <label>
          URL
          <input type={'text'} ref={this.urlInput} defaultValue={org.url} maxLength={100} disabled={disableAll} />
        </label>
        <label>
          Phone Number
          <input type={'text'} ref={this.phoneInput} defaultValue={org.phone} maxLength={20} disabled={disableAll} />
        </label>
        <div>
          {deleteButton}
          {publishButton}
        </div>
      </form>
    );
  }
};
