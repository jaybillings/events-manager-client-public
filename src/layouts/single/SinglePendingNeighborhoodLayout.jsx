import React from 'react';

import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";
import PendingNeighborhoodRecord from "../../components/pendingNeighborhoods/PendingNeighborhoodRecord";

/**
 * `SinglePendingNeighborhoodLayout` lays out the single pending neighborhood view.
 *
 * @class
 * @child
 */
export default class SinglePendingNeighborhoodLayout extends SinglePendingListingLayout {
  constructor(props) {
    super(props, 'pending-neighborhoods');
  }

  /**
   * `renderRecord` renders the the pending neighborhood record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.matchingListingLoaded)) return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;

    return <PendingNeighborhoodRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForDuplicate={this.queryForDuplicate}
    />
  }
}
