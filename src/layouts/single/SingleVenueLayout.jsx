import React from 'react';
import {Redirect} from 'react-router';
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
      messages: [], messagePanelVisible: false,
      listing: {}, listingLoaded: false, hoods: [], hoodsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.hoodsService = app.service('neighborhoods');
  }

  fetchAllData() {
    const uuid = this.props.match.params.id;

    //this.setState({listingLoaded: false, hoodsLoaded: false});

    this.listingsService.find({query: {uuid: uuid}}).then(message => {
      this.setState({listing: message.data[0], listingLoaded: true});
    }, err => {
      console.log('error', err);
      this.setState({notFound: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  renderRecord() {
    if (!(this.state.listingLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Pleased be patient...</p>
    }

    return <VenueRecord
      listing={this.state.listing} hoods={this.state.hoods}
      saveListing={this.saveListing} deleteListing={this.deleteListing}
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
