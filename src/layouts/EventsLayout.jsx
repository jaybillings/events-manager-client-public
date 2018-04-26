import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import EventsTable from '../components/events/EventsTable';
import EventAddForm from '../components/events/EventAddForm';

export default class EventsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [], venues: [], organizers: [],
      eventsLoaded: false, venuesLoaded: false, orgsLoaded: false
    };

    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.eventsService
      .on('created', (message) => {
        console.log('added', message);
        this.fetchAllData();
      })
      .on('patched', (message) => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', (message) => {
        console.log('deleted', message);
        this.fetchAllData();
      });
  }

  fetchAllData() {
    // TODO: Is there a better way to update?
    this.eventsService.find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then(message => {
      this.setState({events: message.data, eventsLoaded: true});
    });

    this.venuesService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true})
    });

    this.orgsSerivce.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({organizers: message.data, orgsLoaded: true})
    });
  }

  renderTable() {
    if (!(this.state.eventsLoaded && this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventsTable events={this.state.events} venues={this.state.venues} organizers={this.state.organizers}/>;
  }

  renderForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventAddForm venues={this.state.venues} organizers={this.state.organizers}/>;
  }

  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Events</h2>
        <h3>View/Modify</h3>
        {this.renderTable()}
        <h3>Add New Event</h3>
        {this.renderForm()}
      </div>
    );
  }
};
