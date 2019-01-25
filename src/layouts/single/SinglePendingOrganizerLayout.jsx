import React from 'react';

import PendingOrganizerRecord from "../../components/pendingOrganizers/PendingOrganizerRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

export default class SinglePendingOrganizerLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'pending-organizers');
  }

  /**
   * Renders the record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord
      listing={this.state.listing} saveListing={this.updateListing} deleteListing={this.deleteListing}
      queryForExisting={this.queryForExisting}
    />;
  }
}
