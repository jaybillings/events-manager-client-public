import React from 'react';
import {arrayUnique, buildSortQuery, renderTableHeader} from "../../utilities";
import app from '../../services/socketio';
import uuid from "uuid/v1";

import EventAddForm from '../../components/events/EventAddForm';
import EventRow from "../../components/events/EventRow";
import ListingsLayout from "../../components/ListingsLayout";
import PaginationLayout from "../../components/common/PaginationLayout";
import Filters from "../../components/common/Filters";

/**
 * EventsLayout is a generic component that lays out an event collection page.
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

    Object.assign(this.state, {
      venues: [], orgs: [], tags: [], venuesLoaded: false, orgsLoaded: false, tagsLoaded: false, filter: {}
    });

    this.pendingEventService = app.service('pending-events');
    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');
    this.liveEventService = app.service('events-live');
    this.droppedEventService = app.service('events-dropped');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchLiveListings = this.fetchLiveListings.bind(this);

    this.checkForLive = this.checkForLive.bind(this);
    this.updateFilters = this.updateFilters.bind(this);

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
    super.componentDidMount();

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

    this.eventsTagsLookupService
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
    super.componentWillUnmount();

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

    this.eventsTagsLookupService
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
   *
   * @returns {Promise}
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
   * @override
   *
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
   * @override
   *
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
   * @override
   *
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
   * Creates a pending event that duplicates the data from the given live event.
   *
   * @param {object} eventData
   * @returns {Promise}
   */
  createPendingListing(eventData) {
    console.log('in copyaspending');
    const eventID = eventData.id;
    delete (eventData.id);

    return this.pendingEventService.create(eventData).then(result => {
      this.setState({newPendingListing: message});
      this.updateMessagePanel({status: 'success', details: `Pending event "${result.name}" created.`});
      this.copyTagAssociations(eventID, result.id);
    }, errors => {
      console.log(errors);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(errors)});
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

    this.eventsTagsLookupService.create(tagsToSave).catch(err => {
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
    this.eventsTagsLookupService.remove(null, {query: {event_id: id}}).catch(err => {
      const details = `Could remove tags associated with event #${id}.`
        + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Copies tag associations from the live event to the newly created pending event.
   *
   * @param liveID
   * @param pendingID
   */
  copyTagAssociations(liveID, pendingID) {
    // Find IDs of linked tags
    this.eventsTagsLookupService.find({query: {event_id: liveID}})
      .then(result => {
        console.log('result', result);
        const tagIDs = result.data.map(row => row.tag_id);
        // Fetch data for returned IDs, to get UUID
        return this.tagsService.find({query: {id: {$in: tagIDs}}});
      })
      .then(result => {
        console.log('result', result);
        const tagsToLink = [];
        result.data.forEach(row => tagsToLink.push({pending_event_id: pendingID, tag_uuid: row.uuid}));
        // Create pending links
        return this.pendingEventsTagsLookupService.create(tagsToLink);
      })
      .then(() => {
        this.updateMessagePanel({status: 'info', details: 'Live event tags linked to new pending event.'});
      })
      .catch(err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        console.log(err);
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
   * @override
   *
   * @returns {*}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.orgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No events to list.</p>;
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venue', 'Venue'],
      ['fk_org', 'Organizer'],
      ['updated_at', 'Last Modified'],
      ['is_published_NOSORT', 'Status']
    ]);

    const venues = this.state.venues;
    const orgs = this.state.orgs;

    return ([
      <Filters key={'events-filters'} updateFilters={this.updateFilters} />,
      <PaginationLayout
        key={'events-pagination'} schema={'events'} total={this.state.listingsTotal} pageSize={this.state.pageSize}
        activePage={this.state.currentPage}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <table key={'events-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.listings.map(event =>
            <EventRow
              key={event.uuid} schema={'events'} listing={event}
              venues={venues} orgs={orgs}
              venue={venues.find(v => {
                return v.id === event.venue_id
              })}
              org={orgs.find(o => {
                return o.id === event.org_id
              })}
              updateListing={this.updateListing} deleteListing={this.deleteListing}
              copyAsPending={this.createPendingListing} checkForLive={this.checkForLive}
              checkForPending={this.checkForPending}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }

  /**
   * Renders the form for adding a new event.
   * @override
   *
   * @returns {*}
   */
  renderAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const venues = this.state.venues;
    const orgs = this.state.orgs;
    const tags = this.state.tags;

    return <EventAddForm
      venues={venues} orgs={orgs} tags={tags} createListing={this.createListing}
      createPendingListing={this.createPendingListing}
    />;
  }
};
