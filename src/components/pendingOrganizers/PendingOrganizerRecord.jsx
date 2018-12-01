import React from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';
import ListingRecordUniversal from "../ListingRecordUniversal";

export default class PendingOrganizerRecord extends ListingRecordUniversal {
  constructor(props) {
    super(props);

    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
  }

  handleSubmit(e) {
    e.preventDefault();

    const listing = this.props.listing;
    const newData = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have a value
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value.trim());
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value.trim());

    this.props.saveListing(listing.id, newData);
  }

  render() {
    const listing = this.props.pendingOrg;
    const createdAt = Moment(listing.created_at).calendar();
    const updatedAt = Moment(listing.updated_at).calendar();

    return (
      <form id={'pending-org-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={listing.uuid} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={listing.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={listing.description} required maxLength={500} />
        </label>
        <label>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={listing.url} maxLength={100} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={listing.phone} maxLength={20} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleClickDelete}>Discard Organizer</button>
        </div>
      </form>
    )
  }
}
