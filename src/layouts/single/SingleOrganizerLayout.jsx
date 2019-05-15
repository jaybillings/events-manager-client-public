import React from "react";

import SingleListingLayout from "../../components/SingleListingLayout";
import OrganizerRecord from "../../components/organizers/OrganizerRecord";

/**
 * SingleOrganizerLayout is a component which lays out a single organizer page.
 * @class
 * @child
 */
export default class SingleOrganizerLayout extends SingleListingLayout {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'organizers');
  }

  /**
   * Renders the organizer record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <OrganizerRecord
      listing={this.state.listing} updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }
};
