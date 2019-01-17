import React from 'react';

import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import OrganizerRecord from "./SingleOrganizerLayout";
import PendingNeighborhoodRecord from "../../components/pendingNeighborhoods/PendingNeighborhoodRecord";

/**
 * SinglePendingNeighborhoodLayout is a component which lays out a single pending neighborhood page.
 * @class
 * @child
 */
export default class SinglePendingNeighborhoodLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'pending-neighborhoods');
  }

  /**
   * Renders the neighborhood record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingNeighborhoodRecord
      listing={this.state.listing} updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForExisting={this.queryForExisting}
    />
  }
}
