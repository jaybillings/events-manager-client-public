import React from 'react';
import {Redirect} from 'react-router';

import Header from "../../components/common/Header";
import MessagePanel from "../../components/common/MessagePanel";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import PendingTagRecord from "../../components/pendingTags/PendingTagRecord";

export default class SinglePendingTagLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'pending-tags');
  }

  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <PendingTagRecord
      listing={this.state.listing} saveListing={this.saveListing} deleteListing={this.deleteListing}
    />
  }

  render() {
    if (this.state.notFound) {
      return <Redirect to={'/404'} />
    }

    if (this.state.hasDeleted) {
      return <Redirect to={`/import`} />
    }

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    // TODO: Add 'return to import screen' button
    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
