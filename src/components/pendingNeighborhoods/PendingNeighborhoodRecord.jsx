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
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const hood = this.props.listing;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(hood.created_at).calendar();
    const updatedAt = Moment(hood.updated_at).calendar();

    return (
      <form id={'pending-hood-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-neighborhoods'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={hood.uuid} readOnly />
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
          <input type={'text'} ref={this.nameInput} defaultValue={hood.name} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} className={'default'} onClick={this.handleDeleteClick}>Discard Neighborhood</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
