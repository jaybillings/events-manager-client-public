import React from "react";
import ListingsLayout from "../../components/ListingsLayout";
import OrganizerAddForm from "../../components/organizers/OrganizerAddForm";

/**
 * OrganizersLayout is a component which lays out an organizer collection page.
 * @class
 * @child
 */
export default class OrganizersLayout extends ListingsLayout {
  /**
   * The class's constructor.
   * @param {object} props
   */
  constructor(props) {
    super(props, 'organizers');
  }

  /**
   * Renders the form for adding a new organizer.
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
