import React from 'react';

import PendingTagRecord from "../../components/pendingTags/PendingTagRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * SinglePendingTagLayout is a component which lays out a single pending tag page.
 */
export default class SinglePendingTagLayout extends SinglePendingListingLayout {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param props
   */
  constructor(props) {
    super(props, 'pending-tags');
  }

  /**
   * Renders the pending tag record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingTagRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />
  }
}
