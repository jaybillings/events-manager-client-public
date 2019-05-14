import React from 'react';

import PendingNeighborhoodRecord from "../../components/pendingNeighborhoods/PendingNeighborhoodRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * SinglePendingNeighborhoodLayout is a component which lays out a single pending neighborhood page.
 * @class
 * @child
 */
export default class SinglePendingNeighborhoodLayout extends SinglePendingListingLayout {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {object} props
   */
  constructor(props) {
    super(props, 'pending-neighborhoods');
  }

  /**
   * Renders the neighborhood record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingNeighborhoodRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />
  }
}
