import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../services/socketio';

import Header from '../components/common/Header';
import EventRecord from '../components/events/EventRecord';

export default class SingleEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {event: {}, isLoaded: false, hasDeleted: false, notFound: false};
    this.eventsService = app.service('events');

    this.deleteEvent = this.deleteEvent.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    const id = this.props.match.params.id;

    this.eventsService.get(id).then(message => {
      this.setState({event: message, isLoaded: true});
    }, (message) => {
      console.log('error', message);
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
    if (!this.state.isLoaded) return <p>Data is loading... Please be patient...</p>;

    return <EventRecord ref="record" event={this.state.event} handleSubmit={this.handleSubmit} deleteEvent={this.deleteEvent} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/events'} />;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.event.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
