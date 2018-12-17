import React from 'react';
import {arrayUnique, buildSortQuery} from "../../utilities";
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
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort, filter: {},
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
    this.fetchLiveListings = this.fetchLiveListings.bind(this);
    this.checkForLive = this.checkForLive.bind(this);

    this.updateFilters = this.updateFilters.bind(this);
    this.updateListing = this.updateListing.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDropped = this.registerEventDropped.bind(this);
  }

  componentDidMount() {
    const reloadEvents = () => {
      this.setState({currentPage: 1}, () => this.fetchListings())
    };

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({status: 'success', details: `Created event #${message.id} - ${message.name}`});
        reloadEvents();
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Updated event #${message.id} - ${message.name}`});
        reloadEvents();
      })
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Updated event #${message.id} - ${message.name}`});
        reloadEvents();
      })
      .on('removed', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted event #${message.id} - ${message.name}`
        });
        reloadEvents();
      });

    this.venuesService
      .on('created', () => {
        this.fetchVenues();
      })
      .on('patched', () => {
        this.fetchVenues();
      })
      .on('removed', () => {
        this.fetchVenues();
      });

    this.orgsSerivce
      .on('created', () => {
        this.fetchOrgs();
      })
      .on('patched', () => {
        this.fetchOrgs();
      })
      .on('removed', () => {
        this.fetchOrgs();
      });

    this.tagsService
      .on('created', () => {
        this.fetchTags();
      })
      .on('patched', () => {
        this.fetchTags();
      })
      .on('removed', () => {
        this.fetchTags();
      });

    this.liveEventService
      .on('created', message => {
        this.updateMessagePanel({status: 'info', details: `Event #${message.id} added to live list.`});
      })
      .on('removed', message => {
        this.updateMessagePanel({status: 'info', details: `Event #${message.id} removed from live list.`});
      });

    this.droppedEventService
      .on('created', message => {
        this.updateMessagePanel({status: 'info', details: `Event #${message.id} added to dropped list.`});
      })
      .on('removed', message => {
        this.updateMessagePanel({status: 'info', details: `Event #${message.id} removed from dropped list.`});
      });

    this.tagsLookupService
      .on('created', message => {
        this.updateMessagePanel({status: 'info', details: `Saved tags associated with event #${message.id}`});
      })
      .on('removed', message => {
        this.updateMessagePanel({status: 'info', details: `Removed tags associated with event #${message.id}`});
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
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

    this.liveEventService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    this.droppedEventService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    this.tagsLookupService
      .removeAllListeners('created')
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
    let query = {
      $sort: buildSortQuery(sort),
      $limit: pageSize,
      $skip: pageSize * (currentPage - 1)
    };

    if (this.state.filter) Object.assign(query, this.state.filter);

    this.listingsService.find({query: query}).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true});
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

  fetchLiveListings() {
    return this.liveEventService.find({query: {$limit: 1000}});
  }

  checkForLive(id) {
    return this.liveEventService.find({query: {event_id: id}});
  }

  updateFilters(filterType) {
    switch (filterType) {
      case 'dropped':
        this.fetchLiveListings().then(result => {
          const uniqueIDs = arrayUnique(result.data.map(row => row.event_id));
          this.setState({currentPage: 1, filter: {id: {$nin: uniqueIDs}}}, () => this.fetchListings());
        });
        break;
      case 'stale':
        this.fetchLiveListings().then(result => {
          const uniqueIDs = arrayUnique(result.data.map(row => row.event_id));
          this.setState({currentPage: 1, filter: {id: {$in: uniqueIDs}, end_date: {$lt: new Date().valueOf()}}},
            () => this.fetchListings());
        });
        break;
      case 'live':
        this.fetchLiveListings().then(result => {
          const uniqueIDs = arrayUnique(result.data.map(row => row.event_id));
          this.setState({currentPage: 1, filter: {id: {$in: uniqueIDs}, end_date: {$gte: new Date().valueOf()}}},
            () => this.fetchListings());
        });
        break;
      default:
        this.setState({currentPage: 1, filter: {}}, () => this.fetchListings());
    }
  }

  createListing(eventObj, tagsToSave) {
    // Give new listing a UUID
    eventObj.uuid = uuid();

    return this.listingsService.create(eventObj).then(message => {
      this.createTagAssociations(message.id, tagsToSave);
      // TODO: Add as live if admin, as pending if not
      this.registerEventLive(message.id);
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  updateListing(id, newData, doPublish) {
    // Save changes
    return this.listingsService.patch(id, newData).then(message => {
      if (doPublish) {
        console.log('publishing event');
        this.registerEventLive(id);
      } else {
        console.log('dropping event');
        this.registerEventDropped(id);
      }
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(message => {
      this.removeTagAssociations(id);
      this.registerEventDropped(id);
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  createTagAssociations(id, tagList) {
    let tagsToSave = [];

    tagList.forEach(tagId => tagsToSave.push({event_id: id, tag_id: tagId}));

    this.tagsLookupService.create(tagsToSave).catch(err => {
      const details = `Could not save tags associated with event #${id}.`
        + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  removeTagAssociations(id) {
    this.tagsLookupService.remove(null, {query: {event_id: id}}).catch(err => {
      const details = `Could remove tags associated with event #${id}.`
        + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  registerEventLive(id) {
    // noinspection JSCheckFunctionSignatures
    Promise.all([
      this.liveEventService.create({event_id: id}),
      this.droppedEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event #${id} as live. ${JSON.stringify(err)}`
      });
    });
  }

  registerEventDropped(id) {
    // noinspection JSCheckFunctionSignatures
    Promise.all([
      this.droppedEventService.create({event_id: id}),
      this.liveEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event #${id} as dropped. ${JSON.stringify(err)}`
      });
    });
  }

  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No events to list.</p>;
    }

    const events = this.state.listings;
    const venues = this.state.venues;
    const orgs = this.state.orgs;

    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.listingsTotal;
    const sort = this.state.sort;

    return <EventsTable
      listings={events} listingsTotal={total} venues={venues} orgs={orgs}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      updateColumnSort={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage}
      updateListing={this.updateListing} deleteListing={this.deleteListing} checkForLive={this.checkForLive}
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
