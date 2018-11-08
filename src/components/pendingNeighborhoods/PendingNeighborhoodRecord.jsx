import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";

export default class PendingNeighborhoodRecord extends ListingRecordUniversal {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  render() {
    const pendingHood = this.props.pendingListing;
    const hoodId = pendingHood.target_id || 'N/A';
    const createdAt = Moment(pendingHood.created_at).calendar();
    const updatedAt = Moment(pendingHood.updated_at).calendar();

    return (
      <form id={'pending-hood-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Neighborhood ID
          <input type={'text'} value={hoodId} disabled />
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
        <div className={'block-warning'} title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <button type="submit" className={'button-primary'}>Save Changes</button>
          <button type="button" onClick={this.handleClickDelete}>Discard Neighborhood</button>
        </div>
      </form>
    );
  }
};
