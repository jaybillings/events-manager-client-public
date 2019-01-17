import React from 'react';
import {arrayUnique, buildSortQuery} from "../../utilities";
import app from '../../services/socketio';
import uuid from "uuid/v1";

import EventsTable from '../../components/events/EventsTable';
import EventAddForm from '../../components/events/EventAddForm';
import ListingsLayout from "../../components/ListingsLayout";

/**
 * EventsLayout is a generic component that lays out an event collection page.
 *
 * @class
 * @child
 */
export default class EventsLayout extends ListingsLayout {
  /**
   * The class's constructor.
   *
   * @param {object} props
   */
  constructor(props) {
    super(props, 'events');

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

  /**
   * Runs when the component mounts. Fetches data and registers data service listeners.
   * @override
   */
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
      .on('created', this.fetchVenues())
      .on('patched', this.fetchVenues())
      .on('removed', this.fetchVenues());

    this.orgsSerivce
      .on('created', this.fetchOrgs())
      .on('patched', this.fetchOrgs())
      .on('removed', this.fetchOrgs());

    this.tagsService
      .on('created', this.fetchTags())
      .on('patched', this.fetchTags())
      .on('removed', this.fetchTags());

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

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
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

  /**
   * Fetches all data required for the page.
   * @override
   */
  fetchAllData() {
    this.fetchListings();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
  }

  /**
   * Fetches data for all published events. Handles table page size, page skipping, column sorting, and result set
   * filtering.
   * @override
   */
  fetchListings() {
    let query = {
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };

    if (this.state.filter) Object.assign(query, this.state.filter);

    this.listingsService.find({query: query}).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({listingsLoaded: false});
    });
  }

  /**
   * Fetches data for all published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({venuesLoaded: false});
    });
  }

  /**
   * Fetches data for all published organizers.
   */
  fetchOrgs() {
    this.orgsSerivce.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({orgsLoaded: false});
    });
  }

  /**
   * Fetches data for all published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({tagsLoaded: false});
    });
  }

  /**
   * Fetches a list of all live events.
   * @returns {Promise<*>}
   */
  fetchLiveListings() {
    return this.liveEventService.find({query: {$limit: 1000}});
  }

  /**
   * Checks the live status of a given event.
   *
   * @param {int} id
   * @returns {Promise<*>}
   */
  checkForLive(id) {
    return this.liveEventService.find({query: {event_id: id}});
  }

  /**
   * Updates filtering for event fetching.
   *
   * `updateFilters` updates the data fetch filter, then executes a new fetch with the new filter. The current page is
   * reset to 1. Possible filter values are:
   *   * dropped - events are not present in the live list
   *   * stale - events are present in the live list, but their end dates are in the past
   *   * live - events are present in the live list, and their end dates are not in the past
   *   * default - all events
   *
   * @param {string} filterType - Which filter option to apply.
   */
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

  /**
   * Creates a new event by generating a UUID and calling the service's CREATE method with passed-in data. Adds the
   * new event to the live list.
   *
   * @override
   * @param {object} eventData - Data for the new listing.
   * @returns {Promise}
   */
  createListing(eventData) {
    eventData.eventObj.uuid = uuid();

    return this.listingsService.create(eventData.eventObj).then(message => {
      this.createTagAssociations(message.id, eventData.tagsToSave);
      // TODO: Add as live if admin, as pending if not
      this.registerEventLive(message.id);
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates a given event by calling the service's PATCH method with passed-in data. If required, alters event's
   * live status.
   *
   * @override
   * @param {int} id
   * @param {object} newData
   * @returns {Promise}
   */
  updateListing(id, newData) {
    return this.listingsService.patch(id, newData.newData).then(() => {
      if (newData.doPublish) {
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

  /**
   * Deletes a given event by calling the service's REMOVE method. Removes all tag associations and registers event
   * as dropped.
   *
   * @override
   * @param {int} id
   */
  deleteListing(id) {
    this.listingsService.remove(id).then(() => {
      this.removeTagAssociations(id);
      this.registerEventDropped(id);
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Creates associations between a given event and its tags.
   *
   * @param {int} id
   * @param {Array} tagList - A list of tags IDs to associate.
   */
  createTagAssociations(id, tagList) {
    let tagsToSave = [];

    tagList.forEach(tagId => tagsToSave.push({event_id: id, tag_id: tagId}));

    this.tagsLookupService.create(tagsToSave).catch(err => {
      const details = `Could not save tags associated with event #${id}.`
        + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Deletes associations between a given event and its tags.
   *
   * @param id
   */
  removeTagAssociations(id) {
    this.tagsLookupService.remove(null, {query: {event_id: id}}).catch(err => {
      const details = `Could remove tags associated with event #${id}.`
        + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Registers a given event as live by removing it from the dropped list and adding it to the live list.
   *
   * @param id
   */
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

  /**
   * Registers a given event as dropped by removing it from the live list and adding it to the dropped list.
   *
   * @param id
   */
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

  /**
   * Renders the event collection table.
   *
   * @override
   * @returns {*}
   */
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

  /**
   * Renders the form for adding a new event.
   *
   * @override
   * @returns {*}
   */
  renderAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const venues = this.state.venues;
    const orgs = this.state.orgs;
    const tags = this.state.tags;

    return <EventAddForm venues={venues} orgs={orgs} tags={tags} createListing={this.createListing} />;
  }
};
