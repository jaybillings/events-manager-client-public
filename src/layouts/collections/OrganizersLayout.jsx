import React from "react";
import ListingsLayout from "../../components/ListingsLayout";
import OrganizerAddForm from "../../components/organizers/OrganizerAddForm";

/**
 * `OrganizersLayout` lays out the organizer collection view.
 *
 * @class
 * @child
 */
export default class OrganizersLayout extends ListingsLayout {
  constructor(props) {
    super(props, 'organizers');
  }

  /**
   * Renders the form for adding a new organizer.
   *
   * @override
   * @returns {*}
   */
  renderAddForm() {
    if (!this.state.listingsLoaded) return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;

    return <OrganizerAddForm
      schema={'organizers'} listings={this.state.listings}
      createListing={this.createListing} createPendingListing={this.createPendingListing}
    />;
  }
};
