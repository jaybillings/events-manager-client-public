import React from 'react';
import app from "../../services/socketio";

import PendingVenueRecord from "../../components/pendingVenues/PendingVenueRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

import {uniqueListingsOnly} from "../../utilities";

/**
 * SinglePendingVenueLayout is a component which lays out a single pending venue page.
 * @class
 * @child
 */
export default class SinglePendingVenueLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'pending-venues');

    Object.assign(this.state, {hoods: [], hoodsLoaded: false});

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', this.fetchHoods)
      .on('patched', this.fetchHoods)
      .on('updated', this.fetchHoods)
      .on('removed', this.fetchHoods);

    this.pendingHoodsService
      .on('created', this.fetchPendingHoods)
      .on('patched', this.fetchPendingHoods)
      .on('updated', this.fetchPendingHoods)
      .on('removed', this.fetchPendingHoods);
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

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
   * Fetches all data required for the page.
   * @override
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchHoods();
    this.fetchPendingHoods();
  }

  /**
   * Fetches published neighborhoods.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  /**
   * Fetches pending neighborhoods.
   */
  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingHoods: message.data, pendingHoodsLoaded: true});
    });
  }

  /**
   * Renders the pending venue record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.hoodsLoaded && this.state.pendingHoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>
    }

    const uniqueHoods = uniqueListingsOnly(this.state.hoods, this.state.pendingHoods);

    return <PendingVenueRecord
      listing={this.state.listing} hoods={uniqueHoods}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />;
  }
}
