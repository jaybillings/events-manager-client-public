import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingNeighborhoodRecord is a component which displays a single pending neighborhood's record.
 * @class
 * @child
 */
export default class PendingNeighborhoodRecord extends ListingRecordUniversal {
  /**
   * Runs when the component mounts. Checks for write status of listing.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
  }

  /**
   * Renders the component.
   * @render
   * @returns {*}
   */
  render() {
    const pendingHood = this.props.listing;
    const createdAt = Moment(pendingHood.created_at).calendar();
    const updatedAt = Moment(pendingHood.updated_at).calendar();
    const writeStatus = this.props.writeStatus;

    return (
      <form id={'pending-hood-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-neighborhoods'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={pendingHood.uuid} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={pendingHood.name} required maxLength={100} />
        </label>
        <div className={'block-warning'}
             title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <button type="button" onClick={this.handleDeleteClick}>Discard Neighborhood</button>
          <button type="submit" className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
