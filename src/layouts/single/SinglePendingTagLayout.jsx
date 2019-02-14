import React from 'react';

import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import PendingTagRecord from "../../components/pendingTags/PendingTagRecord";

/**
 * SinglePendingTagLayout is a component which lays out a single pending tag page.
 */
export default class SinglePendingTagLayout extends SingleListingLayoutUniversal {
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
      listing={this.state.listing} schema={this.schema} updateListing={this.updateListing}
      deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />
  }
}
