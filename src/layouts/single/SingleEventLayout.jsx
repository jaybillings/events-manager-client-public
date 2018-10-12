import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import EventRecord from '../../components/events/EventRecord';

export default class SingleEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      event: {}, venues: [], organizers: [], tags: [], eventTags: [],
      eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.eventsService
      .on('patched', (message) => {
        console.log('patched', message);
        this.setState({event: message});
      })
      .on('removed', (message) => {
        console.log('removed', message);
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.eventsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.setState({eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false});

    this.eventsService.get(id).then(message => {
      this.setState({event: message, eventLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });

    this.venuesService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true})
    });

    this.orgsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({organizers: message.data, orgsLoaded: true})
    });

    this.tagsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({tags: message.data});
      this.tagsLookupService.find({query: {event_id: id}}).then(message => {
        let tagsForEvent = message.data.map(row => row.tag_id);
        this.setState({eventTags: tagsForEvent, tagsLoaded: true});
      });
    });
  }

  renderRecord() {
    if (!(this.state.eventLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventRecord event={this.state.event} venues={this.state.venues} organizers={this.state.organizers}
                        tags={this.state.tags} eventTags={this.state.eventTags} />;
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
