import React from 'react';

import PendingOrganizerRecord from "../../components/pendingOrganizers/PendingOrganizerRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SinglePendingOrganizerLayout is a component which lays out a single pending organizer page.
 */
export default class SinglePendingOrganizerLayout extends SingleListingLayoutUniversal {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param props
   */
  constructor(props) {
    super(props, 'pending-organizers');
  }

  /**
   * Renders the record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord
      listing={this.state.listing} schema={this.schema} updateListing={this.updateListing}
      deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />;
  }
}
