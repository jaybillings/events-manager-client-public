import React from "react";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import VenueRecord from "../../components/venues/VenueRecord";
import MessagePanel from "../../components/common/MessagePanel";
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
      .on('created', this.fetchHoods())
      .on('patched', this.fetchHoods())
      .on('updated', this.fetchHoods())
      .on('removed', this.fetchHoods());
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

  fetchListing() {
    this.listingsService.get(this.props.match.params.id).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      console.log('fetch venue error', JSON.stringify(err));
      this.setState({notFound: true});
    });
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

  render() {
    if (this.state.notFound) {
      return <Redirect to={'/404'} />
    }

    if (this.state.hasDeleted) {
      return <Redirect to={'/venues'} />
    }

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={'/venues'}>&lt; Return to venues</Link></p>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
