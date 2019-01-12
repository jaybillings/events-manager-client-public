import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";

/**
 * PendingTagRecord is a component which displays a single pending tag's record.
 *
 * @class
 * @child
 */
export default class PendingTagRecord extends ListingRecordUniversal {
  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const pendingTag = this.props.listing;
    const tagId = pendingTag.target_id || 'N/A';
    const createdAt = Moment(pendingTag.created_at).calendar();
    const updatedAt = Moment(pendingTag.updated_at).calendar();

    return (
      <form id={'pending-tag-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Tag ID
          <input type={'text'} value={tagId} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={pendingTag.name} required maxLength={100} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleDeleteClick}>Discard Tag</button>
        </div>
      </form>
    );
  }
};
