import React from 'react';
import {Redirect} from 'react-router';

import Header from '../../components/common/Header';
import PendingNeighborhoodRecord from '../../components/pendingNeighborhoods/PendingNeighborhoodRecord';
import MessagePanel from '../../components/common/MessagePanel';
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SinglePendingNeighborhoodLayout is a component which lays out a single neighborhood page.
 *
 * @class
 * @child
 */
export default class SinglePendingNeighborhoodLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'pending-neighborhoods');
  }

  /**
   * Renders the neighborhood's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!this.state.listingLoaded) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <PendingNeighborhoodRecord
      pendingListing={this.state.listing} saveListing={this.saveListing} deleteListing={this.deleteListing}
    />;
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
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

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
