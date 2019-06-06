import React from 'react';
import {Link, Redirect} from "react-router-dom";
import {MdChevronLeft} from "react-icons/md";
import {printToConsole} from "../utilities";

import SingleListingLayout from "./SingleListingLayout";
import ListingRecordUniversal from "./ListingRecordUniversal";
import Header from "./common/Header";
import MessagePanel from "./common/MessagePanel";

/**
 * `SinglePendingListingLayout` is a generic component which lays out the single pending listing view.
 *
 * @class
 * @child
 * @parent
 */
export default class SinglePendingListingLayout extends SingleListingLayout {
  constructor(props, schema) {
    super(props, schema);

    this.state = {...this.state, matchingLiveListing: null};

    this.fetchMatchingLiveListing = this.fetchMatchingLiveListing.bind(this);
  }

  /**
   * Fetches all data required for the view.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListing();
  }

  /**
   * `fetchListing` fetches data for the single listing and saves it to the state.
   *
   * For pending listings, once the listing is returned `fetchListing` also fetches
   * the matching published listing.
   *
   * @override
   */
  fetchListing() {
    this.pendingListingsService.get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.fetchMatchingLiveListing(result.uuid);
      })
      .catch(err => {
        printToConsole(err);
        this.setState({notFound: true});
      })
  }

  /**
   * `fetchMatchingLiveListing` queries the database for a published listing with
   * the same UUID as the pending listing and saves the result to the state.
   *
   * @override
   * @param {String|int} uuid
   */
  fetchMatchingLiveListing(uuid) {
    this.listingsService.find({query: {uuid}})
      .then(result => {
        if (result.total) this.setState({matchingLiveListing: result.data[0]});
        this.setState({matchingListingLoaded: true});
      })
      .catch(err => printToConsole(err));
  }

  /**
   * `renderRecord` renders the listing's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.matchingListingLoaded)) return <div className={'message-compact single-message info'}>Data is loading...
      Please be patient...</div>;

    return <ListingRecordUniversal
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForDuplicate={this.queryForDuplicate}
    />
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    const returnTarget = 'import';
    const headerTitle = 'Caution: This event is pending. It must be pushed live before it is visible on the site.';

    if (this.state.hasDeleted) return <Redirect to={`/${returnTarget}`} />;

    const listingName = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p className={'message-atom'}><Link to={`/${returnTarget}`}><MdChevronLeft />Return to {returnTarget}</Link></p>
        <MessagePanel ref={this.messagePanel} />
        <div className={'block-warning'}><h2 title={headerTitle}>{listingName}</h2></div>
        {this.renderRecord()}
      </div>
    );
  }
};
