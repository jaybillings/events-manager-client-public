import React from "react";
import app from "../../services/socketio";

import VenueRecord from "../../components/venues/VenueRecord";
import SingleListingLayout from "../../components/SingleListingLayout";

/**
 * `SingleVenueLayout` lays out a single venue view.
 *
 * @class
 * @child
 */
export default class SingleVenueLayout extends SingleListingLayout {
  constructor(props) {
    super(props, 'venues');

    this.state = {...this.state, hoods: [], hoodsLoaded: false};

    this.hoodsService = app.service('neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
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
  }

  /**
   * `fetchAllData` fetches all data required for the view.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchHoods();
  }

  /**
   * `fetchHoods` fetches published neighborhoods and saves them to the state.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  /**
   * Renders the venue record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.hoodsLoaded)) {
      return <div className={'message-compact single-message info'}>Data is loading... Pleased be patient...</div>
    }

    return <VenueRecord
      listing={this.state.listing} hoods={this.state.hoods}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />
  }
};
