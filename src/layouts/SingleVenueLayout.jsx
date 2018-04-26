import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../services/socketio';

import Header from "../components/common/Header";
import VenueRecord from '../components/venues/VenueRecord';

export default class SingleVenueLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      venue: {}, neighborhoods: [], venueLoaded: false, hoodsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.venuesService = app.service('venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.venuesService
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({hasDeleted: true});
      });
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.setState({venueLoaded: false, hoodsLoaded: false});

    this.venuesService.get(id).then(message => {
      this.setState({venue: message, venueLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({neighborhoods: message.data, hoodsLoaded: true});
    });
  }

  renderRecord() {
    if (!(this.state.venueLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Pleased be patient...</p>;
    }

    return (<VenueRecord ref="record" venue={this.state.venue} neighborhoods={this.state.neighborhoods} />);
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'}/>;

    if (this.state.hasDeleted) return <Redirect to={'/venues'}/>;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.venue.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
