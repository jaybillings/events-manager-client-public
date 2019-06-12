import React from 'react';

import PendingOrganizerRecord from "../../components/pendingOrganizers/PendingOrganizerRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * `SinglePendingOrganizerLayout` lays out the single pending organizer view.
 *
 * @class
 * @child
 */
export default class SinglePendingOrganizerLayout extends SinglePendingListingLayout {
  constructor(props) {
    super(props, 'pending-organizers');
  }

  /**
   * `renderRecord` renders the single pending organizer's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.matchingListingLoaded)) return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;

    return <PendingOrganizerRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForDuplicate={this.queryForDuplicate}
    />;
  }
}
