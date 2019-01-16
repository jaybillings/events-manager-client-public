import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../pendingEvents/PendingEventRecord";

/**
 * PendingOrganizerRecord is a component which displays a single pending organizer's record.
 *
 * @class
 * @child
 */
export default class PendingOrganizerRecord extends ListingRecordUniversal {
  /**
   * The class's constructor.
   *
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
   * Handles the submit action by parsing new data and calling a function to create a new pending organizer.
   *
   * @override
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have a value
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value.trim());
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value.trim());

    this.props.updateListing(newData);
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const pendingOrg = this.props.listing;
    const createdAt = Moment(pendingOrg.created_at).calendar();
    const updatedAt = Moment(pendingOrg.updated_at).calendar();
    const writeStatus = this.props.writeStatus;

    return (
      <form id={'pending-org-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={pendingOrg.uuid} disabled />
        </label>
        <label>
          Status
          <StatusLabel writeStatus={writeStatus} schema={'pending-events'} />
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
          <input type={'text'} ref={this.nameInput} defaultValue={pendingOrg.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={pendingOrg.description} required maxLength={500} />
        </label>
        <label>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={pendingOrg.url} maxLength={100} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={pendingOrg.phone} maxLength={20} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleDeleteClick}>Discard Organizer</button>
        </div>
      </form>
    )
  }
}
