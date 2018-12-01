import React from 'react';
import {Redirect} from 'react-router';

import Header from "../../components/common/Header";
import PendingOrganizerRecord from "../../components/pendingOrganizers/PendingOrganizerRecord";
import MessagePanel from "../../components/common/MessagePanel";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

export default class SinglePendingOrganizerLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'pending-organizers');
  }

  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord
      pendingListing={this.state.listing} saveListing={this.saveListing} deleteListing={this.deleteListing}
    />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
