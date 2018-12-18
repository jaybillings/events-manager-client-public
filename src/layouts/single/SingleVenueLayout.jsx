import React from "react";
import app from "../../services/socketio";

import VenueRecord from "../../components/venues/VenueRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

export default class SingleVenueLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'venues');

    this.state = {
      listing: {}, listingLoaded: false, hoods: [], hoodsLoaded: false,
      hasDeleted: false, notFound: false, messages: [], messagePanelVisible: false
    };

    this.hoodsService = app.service('neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', this.fetchHoods)
      .on('patched', this.fetchHoods)
      .on('updated', this.fetchHoods)
      .on('removed', this.fetchHoods);
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.fetchListing();
    this.fetchHoods();
  }

  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

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
