import React from 'react';
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import {displayErrorMessages} from "../utilities";

import SingleListingLayout from "./SingleListingLayout";
import ListingRecordUniversal from "./ListingRecordUniversal";
import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";

export default class SinglePendingListingLayout extends SingleListingLayout {
  constructor(props, schema) {
    super(props, schema);

    this.state = {...this.state, matchingLiveListing: null};

    this.fetchMatchingLiveListing = this.fetchMatchingLiveListing.bind(this);
  }

  fetchAllData() {
    this.fetchListing();
  }

  fetchListing() {
    this.pendingListingsService
      .get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.fetchMatchingLiveListing(result.uuid);
      })
      .catch(errors => {
        this.setState({notFound: true});
        displayErrorMessages('fetch', `${this.schema} #${this.listingID}`, errors, this.updateMessagePanel);
      });
  }

  /**
   * Fetches a live listing with the current listing's UUID.
   */
  fetchMatchingLiveListing(uuid) {
    console.debug(uuid);
    this.listingsService
      .find({query: {uuid: uuid}})
      .then(result => {
        console.debug(result);
        if (result.total !== 0) this.setState({matchingLiveListing: result.data[0]});
      })
      .catch(errors => {
        console.error(errors);
      });
  }

  renderRecord() {
    if (!this.state.listingLoaded) return <p>Data is loading... Please be patient...</p>;

    return <ListingRecordUniversal
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForExisting={this.queryForExisting}
    />
  }

  render() {
    const returnTarget = 'import';
    const headerTitle = 'Caution: This event is pending. It must be pushed live before it is visible on the site.';

    if (this.state.hasDeleted) return <Redirect to={`/${returnTarget}`} />;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={`/${returnTarget}`}>&lt; Return to {returnTarget}</Link></p>
        <MessagePanel
          messages={this.state.messages} isVisible={this.state.messagePanelVisible}
          dismissPanel={this.dismissMessagePanel}
        />
        <div className={'block-warning'}><h2 title={headerTitle}>{this.state.listing.name}</h2></div>
        {this.renderRecord()}
      </div>
    );
  }
};
