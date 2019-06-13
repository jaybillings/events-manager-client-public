import React from 'react';
import app from "../../services/socketio";
import {displayErrorMessages, uniqueListingsOnly} from "../../utilities";

import PendingVenueRecord from "../../components/pendingVenues/PendingVenueRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * `SinglePendingVenueLayout` lays out a single pending venue view.
 *
 * @class
 * @child
 */
export default class SinglePendingVenueLayout extends SinglePendingListingLayout {
  constructor(props) {
    super(props, 'pending-venues');

    this.state = {...this.state, hoods: [], hoodsLoaded: false, pendingHoods: [], pendingHoodsLoaded: false};

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
  }

  /**
   * Runs once the component mounts.
   *
   * During `componentDidMount`, the component fetches required data and
   * registers service listeners.
   *
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', () => this.fetchHoods)
      .on('patched', () => this.fetchHoods)
      .on('updated', () => this.fetchHoods)
      .on('removed', () => this.fetchHoods);

    this.pendingHoodsService
      .on('created', () => this.fetchPendingHoods)
      .on('patched', () => this.fetchPendingHoods)
      .on('updated', () => this.fetchPendingHoods)
      .on('removed', () => this.fetchPendingHoods);
  }

  /**
   * Runs when the component unmounts.
   *
   * During `componentWillUnmount`, the component unregisters service listeners.
   *
   * @override
   */
  componentWillUnmount() {
    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.pendingHoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * `fetchAllData` fetches all data required for the view.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  /**
   * `fetchHoods` fetches published neighborhoods and saves them to the state.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery})
      .then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    })
      .catch(err => {
      this.setState({hoodsLoaded: false});
      displayErrorMessages('fetch', 'neighborhoods', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * `fetchPendingHoods` fetches pending neighborhoods and saves them to the state.
   */
  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery})
      .then(message => {
      this.setState({pendingHoods: message.data, pendingHoodsLoaded: true});
    })
      .catch(err => {
      this.setState({pendingHoodsLoaded: false});
      displayErrorMessages('fetch', 'pending neighborhoods', err, this.pendingHoodsService, 'reload');
    });
  }

  /**
   * `renderRecord` renders the single pending venue's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.matchingListingLoaded && this.state.pendingHoodsLoaded)) {
      return <div className={'single-message info message-compact'}>Data is loading... Please be patient...</div>
    }

    const uniqueHoods = uniqueListingsOnly(this.state.hoods, this.state.pendingHoods);

    return <PendingVenueRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      hoods={uniqueHoods} updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForDuplicate={this.queryForDuplicate}
    />;
  }
}
