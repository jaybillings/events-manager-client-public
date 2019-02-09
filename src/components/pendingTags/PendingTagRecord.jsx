import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingTagRecord is a component which displays a single pending tag's record.
 * @class
 * @child
 */
export default class PendingTagRecord extends ListingRecordUniversal {
  /**
   * Runs when the component mounts. Checks the publish status of the listing.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const tag = this.props.listing;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(tag.created_at).calendar();
    const updatedAt = Moment(tag.updated_at).calendar();

    return (
      <form id={'pending-tag-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-tags'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={tag.uuid} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={tag.name} required maxLength={100} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'button'} onClick={this.handleDeleteClick}>Discard Tag</button>
          <button type={'button'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
