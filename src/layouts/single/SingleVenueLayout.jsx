import React from "react";
import app from "../../services/socketio";

import VenueRecord from "../../components/venues/VenueRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SingleVenueLayout is a component which lays out a single venue page.
 * @class
 * @child
 */
export default class SingleVenueLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'venues');

    Object.assign(this.state, {hoods: [], hoodsLoaded: false});

    this.hoodsService = app.service('neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', () => this.fetchHoods)
      .on('patched', () => this.fetchHoods)
      .on('updated', () => this.fetchHoods)
      .on('removed', () => this.fetchHoods);
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.hoodsService
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
   * Renders the venue record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Pleased be patient...</p>
    }

    return <VenueRecord
      listing={this.state.listing} hoods={this.state.hoods}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }
};
