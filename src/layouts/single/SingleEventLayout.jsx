import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import EventRecord from '../../components/events/EventRecord';
import MessagePanel from '../../components/common/MessagePanel';

export default class SingleEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      event: {}, venues: [], orgs: [], tags: [], eventTags: [],
      eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.listingsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveTags = this.saveTags.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false});

    // Register listeners
    this.listingsService
      .on('patched', message => {
        this.setState({event: message, eventLoaded: true});
        this.updateMessagePanel({'status': 'success', 'details': 'Changes saved.'});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => {
        console.log("Error handler triggered. Should post to message panel.");
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;
    const defaultQuery = {$sort: {name: 1}, $limit: 100};

    //this.setState({eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false});

    this.listingsService.get(id).then(message => {
      this.setState({event: message, eventLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });

    this.venuesService.find({query: defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true})
    });

    this.orgsService.find({query: defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true})
    });

    this.tagsService.find({query: defaultQuery}).then(message => {
      this.setState({tags: message.data});
      this.tagsLookupService.find({query: {event_id: id}}).then(message => {
        let tagsForEvent = message.data.map(row => row.tag_id);
        this.setState({eventTags: tagsForEvent, tagsLoaded: true});
      });
    });
  }

  deleteEvent(id) {
    this.listingsService.remove(id).then(this.setStatus({hasDeleted: true}));
  }

  saveEvent(id, eventData, tagData) {
    //this.setState({eventLoaded: false});
    this.listingsService.patch(id, eventData).then(message => {
      console.log('patching', message);
      this.saveTags(id, tagData);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  saveTags(id, tagData) {
    this.tagsLookupService.remove(null, {
      query: {
        event_id: id,
        tag_id: {$in: tagData.to_delete}
      }
    }).then(message => {
      console.log('tag-lookup removing', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });

    this.tagsLookupService.create(tagData.to_save).then(message => {
      console.log('tag-lookup creating', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: [msg, ...messageList], messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: true});
  }

  renderRecord() {
    if (!(this.state.eventLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventRecord
      event={this.state.event} venues={this.state.venues} orgs={this.state.orgs}
      tags={this.state.tags} eventTags={this.state.eventTags} saveEvent={this.saveEvent} deleteEvent={this.deleteEvent}
    />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/events'} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const eventName = this.state.event.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{eventName}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
