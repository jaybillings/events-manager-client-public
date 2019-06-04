import React from 'react';

import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";
import PendingTagRecord from "../../components/pendingTags/PendingTagRecord";

/**
 * `SinglePendingTagLayout` lays out the single pending tag view.
 *
 * @class
 * @child
 */
export default class SinglePendingTagLayout extends SinglePendingListingLayout {
  constructor(props) {
    super(props, 'pending-tags');
  }

  /**
   * `renderRecord` renders the single pending tag's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;

    return <PendingTagRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForDuplicate={this.queryForDuplicate}
    />
  }
}
