import React, {Component} from 'react';
import {buildColumnSort, buildSortQuery} from "../../utilities";
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import Filters from '../../components/common/Filters';
import EventsTable from '../../components/events/EventsTable';
import EventAddForm from '../../components/events/EventAddForm';
import MessagePanel from "../../components/common/MessagePanel";

export default class EventsLayout extends Component {
  constructor(props) {
    super(props);

    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];
    this.defaultQuery = {$sort: {name: 1}, $select: ['name'], $limit: 100};

    this.state = {
      events: [], venues: [], orgs: [], tags: [], eventsTotal: 0,
      eventsLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort, filter: {},
      messagePanelVisible: false, messages: []
    };

    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchEvents = this.fetchEvents.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.createEvent = this.createEvent.bind(this);
    this.saveEventTags = this.saveEventTags.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.eventsService
      .on('created', message => {
        console.log('event created', message);
        this.updateMessagePanel({status: 'success', details: `Created event #${message.id} - ${message.name}`});
        this.setState({currentPage: 1}, () => this.fetchEvents());
      })
      .on('patched', message => {
        console.log('event patched', message);
        this.updateMessagePanel({status: 'success', details: `Updated event #${message.id} - ${message.name}`});
        this.fetchEvents();
      })
      .on('removed', message => {
        console.log('event removed', message);
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted event #${message.id} - ${message.name}`
        });
        this.setState({currentPage: 1}, () => this.fetchEvents());
      })
      .on('error', error => {
        console.log('event error', error);
        this.updateMessagePanel({status: 'error', details: error.message});
      });

    this.venuesService
      .on('created', message => {
        console.log('venue created', message);
        this.fetchVenues();
      })
      .on('patched', message => {
        console.log('venue patched', message);
        this.fetchVenues();
      })
      .on('removed', message => {
        console.log('venue removed', message);
        this.fetchVenues();
      });

    this.orgsSerivce
      .on('created', message => {
        console.log('org created', message);
        this.fetchOrgs();
      })
      .on('patched', message => {
        console.log('org patched', message);
        this.fetchOrgs();
      })
      .on('removed', message => {
        console.log('org removed', message);
        this.fetchOrgs();
      });

    this.tagsService
      .on('created', message => {
        console.log('tag created', message);
        this.fetchTags();
      })
      .on('patched', message => {
        console.log('tag patched', message);
        this.fetchTags();
      })
      .on('removed', message => {
        console.log('tag removed', message);
        this.fetchTags();
      });
  }

  componentWillUnmount() {
    this.eventsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.venuesService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.orgsSerivce
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.tagsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.fetchEvents();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
  }

  fetchEvents() {
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const filter = this.state.filter;

    let query = {
      $sort: buildSortQuery(sort),
      $limit: pageSize,
      $skip: pageSize * (currentPage - 1)
    };
    Object.assign(query, filter);

    this.eventsService.find({query: query}).then(message => {
      this.setState({events: message.data, eventsTotal: message.total, eventsLoaded: true});
    });
  }

  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });
  }

  fetchOrgs() {
    this.orgsSerivce.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    });
  }

  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    });
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchEvents());
  }

  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchEvents());
  }

  updateFilters(filterType) {
    let filter = {};

    switch (filterType) {
      case 'dropped':
        filter = {'is_published': 0};
        break;
      case 'stale':
        filter = {'is_published': 1, 'end_date': {$lt: new Date().valueOf()}};
        break;
      case 'live':
        filter = {'is_published': 1, 'end_date': {$gte: new Date().valueOf()}};
        break;
      default:
        filter = {};
    }

    this.setState({currentPage: 1, filter: filter}, () => this.fetchEvents());
  }

  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchEvents());
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: messageList.concat([msg]), messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  deleteEvent(id) {
    this.eventsService.remove(id).then(message => console.log('removing event', message));
    // Remove tags?
  }

  saveEvent(id, newData) {
    this.eventsService.patch(id, newData).then(message => {
      console.log('patching event', message);
    }, err => {
      console.log('error patching event', err);
      this.updateMessagePanel(err);
    });
  }

  createEvent(eventObj, tagData) {
    this.eventsService.create(eventObj).then(message => {
      console.log('creating event', message);
      this.saveEventTags(message.id, tagData);
    }, err => {
      console.log('error creating event', err);
      this.updateMessagePanel(err);
    });
  }

  saveEventTags(id, tagData) {
    let tagsToSave = [];

    tagData.forEach(tagId => tagsToSave.push({event_id: id, tag_id: tagId}));

    this.tagsLookupService.create(tagsToSave).then(message => {
      console.log('tag-lookup creating', message);
    }, err => {
      console.log('tag-lookup error', err);
      this.updateMessagePanel(err);
    });
  }

  renderTable() {
    if (!(this.state.eventsLoaded && this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.eventsTotal === 0) {
      return <p>No events to list.</p>;
    }

    const events = this.state.events;
    const venues = this.state.venues;
    const orgs = this.state.orgs;

    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.eventsTotal;
    const sort = this.state.sort;

    return <EventsTable
      listings={events} listingsTotal={total} venues={venues} orgs={orgs}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      handleColumnClick={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage} deleteListing={this.deleteEvent} saveListing={this.saveEvent}
    />;
  }

  renderAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const venues = this.state.venues;
    const orgs = this.state.orgs;
    const tags = this.state.tags;

    return <EventAddForm venues={venues} orgs={orgs} tags={tags} createEvent={this.createEvent} />;
  }

  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>All Events</h2>
        <Filters updateFilters={this.updateFilters} />
        {this.renderTable()}
        <h2>Add New Event</h2>
        {this.renderAddForm()}
      </div>
    );
  }
};
