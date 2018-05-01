import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import EventsTable from '../../components/events/EventsTable';
import EventAddForm from '../../components/events/EventAddForm';

export default class EventsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      events: [], venues: [], organizers: [], tags: [],
      eventsLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false
    };

    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderEventsTable = this.renderEventsTable.bind(this);
    this.renderEventAddForm = this.renderEventAddForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.eventsService
      .on('created', message => {
        console.log('created', message);
        this.fetchAllData();
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.fetchAllData();
      });
  }

  componentWillUnmount() {
    this.eventsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
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
      this.setState({venues: message.data, venuesLoaded: true});
    });

    this.orgsSerivce.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({organizers: message.data, orgsLoaded: true});
    });

    this.tagsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    })
  }

  renderEventsTable() {
    if (!(this.state.eventsLoaded && this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventsTable events={this.state.events} venues={this.state.venues} organizers={this.state.organizers}/>;
  }

  renderEventAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventAddForm venues={this.state.venues} organizers={this.state.organizers} tags={this.state.tags}/>;
  }

  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Events</h2>
        <h3>View/Modify</h3>
        {this.renderEventsTable()}
        <h3>Add New Event</h3>
        {this.renderEventAddForm()}
      </div>
    );
  }
};
