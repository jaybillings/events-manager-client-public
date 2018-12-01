import React from "react";
import ListingsLayout from "../../components/ListingsLayout";
import OrganizerAddForm from "../../components/organizers/OrganizerAddForm";

export default class OrganizersLayout extends ListingsLayout {
  constructor(props) {
    super(props, 'organizers');
  }

  renderAddForm() {
    if (!this.state.listingsLoaded) return <p>Data is loading... Please be patient...</p>;

    const listings = this.state.listings;

    return <OrganizerAddForm listings={listings} createListing={this.createListing} />;
  }
};
