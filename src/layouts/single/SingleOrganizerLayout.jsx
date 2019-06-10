import React from "react";

import SingleListingLayout from "../../components/SingleListingLayout";
import OrganizerRecord from "../../components/organizers/OrganizerRecord";

/**
 * `SingleOrganizerLayout` lays out a single organizer view.
 *
 * @class
 * @child
 */
export default class SingleOrganizerLayout extends SingleListingLayout {
  constructor(props) {
    super(props, 'organizers');
  }

  /**
   * Renders the organizer record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) {
      return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;
    }

    return <OrganizerRecord
      listing={this.state.listing} updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }
};
