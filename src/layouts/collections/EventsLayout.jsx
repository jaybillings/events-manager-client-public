import React from 'react';
import {buildSortQuery} from "../../utilities";
import app from '../../services/socketio';
import uuid from "uuid/v1";

import Header from '../../components/common/Header';
import Filters from '../../components/common/Filters';
import EventsTable from '../../components/events/EventsTable';
import EventAddForm from '../../components/events/EventAddForm';
import MessagePanel from "../../components/common/MessagePanel";
import ListingsLayout from "../../components/ListingsLayout";

export default class EventsLayout extends ListingsLayout {
  constructor(props) {
    super(props, 'events');

    this.defaultQuery = {$sort: {name: 1}, $select: ['name', 'uuid'], $limit: 100};

    this.state = {
      listings: [], venues: [], orgs: [], tags: [], listingsTotal: 0,
      listingsLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');
    this.tagsLookupService = app.service('events-tags-lookup');
    this.liveEventService = app.service('events-live');
    this.droppedEventService = app.service('events-dropped');

    this.fetchListings = this.fetchListings.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);

    this.updateFilters = this.updateFilters.bind(this);
    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.addToLiveList = this.addToLiveList.bind(this);
    this.addToDropList = this.addToDropList.bind(this);
    this.removeFromLiveList = this.removeFromLiveList.bind(this);
    this.removeFromDropList = this.removeFromDropList.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        console.log('event created', message);
        this.updateMessagePanel({status: 'success', details: `Created event #${message.id} - ${message.name}`});
        this.setState({currentPage: 1}, () => this.fetchListings());
      })
      .on('patched', message => {
        console.log('event patched', message);
        this.updateMessagePanel({status: 'success', details: `Updated event #${message.id} - ${message.name}`});
        this.fetchListings();
      })
      .on('removed', message => {
        console.log('event removed', message);
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted event #${message.id} - ${message.name}`
        });
        this.setState({currentPage: 1}, () => this.fetchListings());
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
    this.listingsService
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
    this.fetchListings();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
  }

  fetchListings() {
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

    this.listingsService.find({query: query}).then(message => {
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

    this.setState({currentPage: 1, filter: filter}, () => this.fetchListings());
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(message => {
      console.log('removing event', message);
      this.removeTagAssociations(id);
    });
    // TODO: Remove from live or dropped list(s)
  }

  saveListing(id, newData) {
    // TODO: Save tags
    this.listingsService.patch(id, newData).then(message => {
      console.log('patching event', message);
    }, err => {
      console.log('error patching event', err);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
    // TODO: Modify live/dropped lists
  }

  createListing(eventObj, tagsToSave) {
    eventObj.uuid = uuid();

    this.listingsService.create(eventObj).then(message => {
      console.log('creating event', message);
      this.createTagAssociations(message.id, tagsToSave);
      // TODO: Add as live if admin, as pending if not
      this.addToLiveList(message.id);
    }, err => {
      console.log('error creating event', err);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
    // TODO: Add to live list
  }

  createTagAssociations(id, tagList) {
    let tagsToSave = [];

    tagList.forEach(tagId => tagsToSave.push({event_id: id, tag_id: tagId}));

    this.tagsLookupService.create(tagsToSave).then(message => {
      this.updateMessageList({status: 'info', details: `Saved tags associated with event #${id}`});
      console.log('tag-lookup creating', message);
    }, err => {
      console.log('tag-lookup error', err);
      const details = `Could not save tags associated with event # ${id}. Please re-save listing on its idividual page.`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  removeTagAssociations(id) {
    console.log('in removeTagAssociations');
    this.tagsLookupService.remove(null, {query: {event_id: id}})
      .then(result => console.log('tag lookup removed', result),
      err => console.log('error removing tag associations', err));
  }

  addToLiveList() {}

  removeFromLiveList() {}

  addToDropList() {}

  removeFromDropList() {}

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
      updateColumnSort={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage} deleteListing={this.deleteListing} saveListing={this.saveListing}
    />;
  }

  renderAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const venues = this.state.venues;
    const orgs = this.state.orgs;
    const tags = this.state.tags;

    return <EventAddForm venues={venues} orgs={orgs} tags={tags} createListing={this.createListing} />;
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
