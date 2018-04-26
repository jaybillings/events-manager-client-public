import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import VenuesTable from '../components/venues/VenuesTable';
import VenueAddForm from '../components/venues/VenueAddForm';

export default class VenuesLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      venues: [], neighborhoods: [], venuesLoaded: false, hoodsLoaded: false
    };

    this.venuesService = app.service('venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.venuesService
      .on('created', (message) => {
        console.log('added', message);
        this.fetchAllData();
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('deleted', message);
        this.fetchAllData();
      });
  }

  fetchAllData() {
    this.venuesService.find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({neighborhoods: message.data, hoodsLoaded: true});
    });
  }

  renderTable() {
    if (!(this.state.venuesLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenuesTable venues={this.state.venues} neighborhoods={this.state.neighborhoods}/>;
  }

  renderForm() {
    if (!this.state.hoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenueAddForm neighborhoods={this.state.neighborhoods}/>;
  }

  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Venues</h2>
        <h3>View/Modify</h3>
        {this.renderTable()}
        <h3>Add New Venue</h3>
        {this.renderForm()}
      </div>
    );
  }
};
