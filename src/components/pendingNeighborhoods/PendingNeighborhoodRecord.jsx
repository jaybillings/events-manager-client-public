import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";
import {diffListings} from "../../utilities";

/**
 * `PendingNeighborhoodRecord` displays a single pending neighborhood's record.
 *
 * @class
 * @child
 * @param {{schema: String, listing: Object, matchingLiveListing: Object, updateListing: Function,
 * deleteListing: Function, queryForDuplicate: Function}} props
 */
export default class PendingNeighborhoodRecord extends ListingRecordUniversal {
  /**
   * Runs before the component is unmounted.
   *
   * During `componentDidMount`, the component fetches the listing's write status.
   *
   * @override
   */
  componentDidMount() {
    this.getWriteStatus()
      .then(writeStatus => {
        console.debug('writeStatus', writeStatus);
        this.setState({writeStatus});
      });
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
    const liveHood = this.props.matchingLiveListing;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(hood.created_at).calendar();
    const updatedAt = Moment(hood.updated_at).calendar();

    const hoodParams = ['name'];
    const classNameMap = diffListings(liveHood, hood, hoodParams);

    return (
      <form id={'pending-hood-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <div>
          <button type={'button'} className={'default'} onClick={this.handleDeleteClick}>Discard Neighborhood</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
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
        <label className={'required' + classNameMap['name']}>
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
