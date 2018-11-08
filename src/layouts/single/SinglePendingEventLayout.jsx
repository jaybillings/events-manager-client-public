import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import MessagePanel from "../../components/common/MessagePanel";

export default class SinglePendingEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingEvent: {}, venues: [], orgs: [], tags: [], eventTags: [],
      eventLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingEventsService = app.service('pending-events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.pendingTagsLookupService = app.service('pending-events-tags-lookup');

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
    this.pendingEventsService
      .on('patched', message => {
        this.setState({pendingEvent: message, eventLoaded: true});
        this.updateMessagePanel({'status': 'success', 'details': `Updated ${this.state.pendingEvent.name} successfully.`});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingEventsService
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;
    const defaultQuery = {$sort: {name: 1}, $limit: 100};

    this.pendingEventsService.get(id).then(message => {
      this.setState({pendingEvent: message, eventLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });

    this.venuesService.find({query: defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });

    this.orgsService.find({query: defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    });

    this.tagsService.find({query: defaultQuery}).then(message => {
      this.setState({tags: message.data});
      this.pendingTagsLookupService.find({query: {pending_event_id: id}}).then(message => {
        let tagsForEvent = message.data.map(row => row.tag_id);
        this.setState({eventTags: tagsForEvent, tagsLoaded: true});
      });
    });
  }

  deleteEvent(id) {
    this.pendingEventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveEvent(id, eventData, tagData) {
    this.pendingEventsService.patch(id, eventData).then(message => {
      console.log('patching', message);
      this.saveTags(id, tagData);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  saveTags(id, tagData) {
    this.pendingTagsLookupService.remove(null, {
      query: {
        pending_event_id: id,
        tag_id: {$in: tagData.to_delete}
      }
    }).then(message => {
      console.log('pending-tag-lookup removing', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });

    this.pendingTagsLookupService.create(tagData.to_save).then(message => {
      console.log('pending-tag-lookup creating', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  checkForChanges() {
    /*
    1. Look for live schema that matches name
    2. If found, emphasize to indicate change
    3. Look for changes to main attributes
    4. If found, emphasize to indicate change
     */
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: [msg, ...messageList], messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!(this.state.eventLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading ... Please be patient...</p>;
    }

    return <PendingEventRecord
      pendingEvent={this.state.pendingEvent} venues={this.state.venues} orgs={this.state.orgs}
      tags={this.state.tags} eventTags={this.state.eventTags} saveEvent={this.saveEvent} deleteEvent={this.deleteEvent}
    />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/import'} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const pendingEventName = this.state.pendingEvent.name;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{pendingEventName}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
};
