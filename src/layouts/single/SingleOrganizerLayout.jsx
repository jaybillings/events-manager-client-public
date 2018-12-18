import React from "react";

import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import OrganizerRecord from "../../components/organizers/OrganizerRecord";

export default class SingleOrganizerLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'organizers');
  }

  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <OrganizerRecord
      listing={this.state.listing} updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }
};
