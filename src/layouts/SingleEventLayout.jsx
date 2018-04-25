import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../services/socketio';

import Header from '../components/common/Header';
import EventRecord from '../components/events/EventRecord';

export default class SingleEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      event: {},
      eventLoaded: false,
      venueLoaded: false,
      orgLoaded: false,
      hasDeleted: false,
      notFound: false
    };
    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    const id = this.props.match.params.id;

    this.eventsService.get(id).then(message => {
      this.setState({event: message, eventLoaded: true});
      this.venuesService.find({query: {$sort: {name: 1}}}).then(message => {
        this.setState({venues: message.data, venueLoaded: true})
      });
      this.orgsService.find({query: {$sort: {name: 1}}}).then(message => {
        this.setState({organizers: message.data, orgLoaded: true})
      });
    }, (message) => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteEvent() {
    const id = this.state.event.id;

    // TODO: Only administrators should be able to delete
    this.eventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  handleSubmit(e) {
    const id = this.state.event.id;
    const newData = {
      name: this.refs.record.refs.nameInput.value.trim(),
      start_date: this.refs.record.refs.startInput.value,
      end_date: this.refs.record.refs.endInput.value,
      venue_id: this.refs.record.refs.venueList.value,
      org_id: this.refs.record.refs.orgList.value,
      description: this.refs.record.refs.descInput.value.trim()
    };

    e.preventDefault();

    this.eventsService.patch(id, newData).then((message) => {
      console.log('patch', message);
      this.setState({event: message});
    }, (message) => {
      console.log('error', message);
    });
  }

  renderRecord() {
    if (!(this.state.eventLoaded && this.state.venueLoaded && this.state.orgLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return (
      <EventRecord ref="record"
                   event={this.state.event}
                   venues={this.state.venues}
                   organizers={this.state.organizers}
                   handleSubmit={this.handleSubmit}
                   deleteEvent={this.deleteEvent}
      />
    );
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'}/>;

    if (this.state.hasDeleted) return <Redirect to={'/events'}/>;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.event.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
