import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingVenueRecord from '../../components/pendingVenues/PendingVenueRecord';

export default class SinglePendingVenueLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingVenue: {}, venueLoaded: false,
      neighborhoods: [], hoodsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingVenuesService = app.service('pending-venues');
    this.neighborhoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.deleteVenue = this.deleteVenue.bind(this);
    this.saveVenue = this.saveVenue.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({venueLoaded: false});

    // Register listeners
    this.pendingVenuesService
      .on('patched', message => {
        this.setState({pendingVenue: message});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.pendingVenuesService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingVenuesService.get(id).then(message => {
      this.setState({pendingVenue: message, venueLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });

    this.neighborhoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({neighborhoods: message.data, hoodsLoaded: true});
    })
  }

  deleteVenue(id) {
    this.pendingVenuesService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveVenue(id, newData) {
    this.pendingVenuesService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', JSON.stringify(err));
    });
  }

  renderRecord() {
    if (!(this.state.venueLoaded && this.state.hoodsLoaded)) return <p>Data is loading... Please be patient...</p>;

    return <PendingVenueRecord pendingVenue={this.state.pendingVenue} neighborhoods={this.state.neighborhoods}
                               saveVenue={this.saveVenue} deleteVenue={this.deleteVenue} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    return (
      <div className={'container'}>
        <Header />
        <div className={'block-warning'}
             title={'Caution: This venue is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingVenue.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
