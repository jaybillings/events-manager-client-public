import React from 'react';
import {arrayUnique, buildSortQuery, displayErrorMessages, renderTableHeader} from "../../utilities";
import app from '../../services/socketio';

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

    this.defaultLimit = 3000;

    this.state = {
      ...this.state, venues: [], orgs: [], tags: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      filterLabel: 'none', liveIDs: [], liveIDsLoaded: false
    };

    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.liveEventsService = app.service('events-live');
    this.deletedEventsService = app.service('events-deleted');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchLiveListings = this.fetchLiveListings.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDeleted = this.registerEventDeleted.bind(this);

    this.updateFilters = this.updateFilters.bind(this);
  }

  /**
   * Runs when the component mounts. Fetches data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.orgsSerivce, this.fetchOrgs],
      [this.venuesService, this.fetchVenues],
      [this.tagsService, this.fetchTags]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher())
    }

    this.liveEventsService
      .on('created', message => {
        console.log('~ event added to live list', message);
        this.updateMessagePanel({status: 'info', details: `Event added to live list.`});
        this.fetchLiveListings();
      })
      .on('removed', () => {
        this.updateMessagePanel({status: 'info', details: `Event removed from live list.`});
        this.fetchLiveListings();
      });

    this.deletedEventsService
      .on('created', () => {
        this.updateMessagePanel({status: 'info', details: `Event added to dropped list.`});
      })
      .on('removed', () => {
        this.updateMessagePanel({status: 'info', details: `Event removed from dropped list.`});
      });

    this.eventsTagsLookupService
      .on('created', () => {
        this.updateMessagePanel({status: 'info', details: `Saved tags associated with event.`});
      })
      .on('removed', () => {
        this.updateMessagePanel({status: 'info', details: `Removed tags associated with event.`});
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    const services = [
      this.orgsSerivce,
      this.venuesService,
      this.tagsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });

    const secondaryServices = [
      this.liveEventsService,
      this.deletedEventsService,
      this.eventsTagsLookupService
    ];

    secondaryServices.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('removed');
    });
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
    this.fetchLiveListings();
  }

  /**
   * Fetches published events, based on table settings. Handles page size, page skipping, column sorting,
   * and result set filtering.
   * @override
   */
  fetchListings() {
    const filterQuery = this.createFilterQuery();
    const query = {
      ...filterQuery,
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };

    this.listingsService.find({query})
      .then(result => {
        this.setState({listings: result.data, listingsTotal: result.total, listingsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'events', err, this.updateMessagePanel, 'reload');
        this.setState({listingsLoaded: false});
      });
  }

  /**
   * Fetches all published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
        this.setState({venuesLoaded: false});
      });
  }

  /**
   * Fetches data for all published organizers.
   */
  fetchOrgs() {
    this.orgsSerivce.find({query: this.defaultQuery})
      .then(message => {
        this.setState({orgs: message.data, orgsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
        this.setState({orgsLoaded: false});
      });
  }

  /**
   * Fetches data for all published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({tags: message.data, tagsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
        this.setState({tagsLoaded: false});
      });
  }

  /**
   * Fetches a list of all live events.
   */
  fetchLiveListings() {
    this.liveEventsService.find({query: {$limit: this.defaultLimit}})
      .then(result => {
        const liveIDList = result.data.map(row => row.event_id) || [];
        const uniqueIDs = arrayUnique(liveIDList);
        this.setState({liveIDs: uniqueIDs, liveIDsLoaded: true}, () => this.fetchListings());
      })
      .catch(err => {
        displayErrorMessages('fetch', 'live events', err, this.updateMessagePanel, 'reload');
        this.setState({liveIDsLoaded: false});
      });
  }

  /**
   * Creates a new event by generating a UUID and calling the service's CREATE method with passed-in data. Adds the
   * new event to the live list.
   * @override
   *
   * @param {{eventID: Number, eventObj: Object, tagsToSave: Array}} eventData
   * @returns {Promise}
   */
  createListing(eventData) {
    return this.listingsService.create(eventData.eventObj)
      .then(result => {
        this.createTagAssociations(result.uuid, eventData.tagsToSave);
        this.registerEventLive(result.id);
      })
      .catch(err => {
        displayErrorMessages('create', `"${eventData.eventObj.name}"`,
          err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Updates a given event by calling the service's PATCH method with passed-in data. If required, alters event's
   * live status.
   * @override
   *
   * @param {int} id
   * @param {{newData: Object, doPublish: Boolean}} newData
   * @returns {Promise}
   */
  updateListing(id, newData) {
    return this.listingsService.patch(id, newData.newData)
      .then(() => {
        if (newData.doPublish) return this.registerEventLive(id);
        else return this.registerEventDeleted(id);
      })
      .catch(err => {
        displayErrorMessages('update', `"${newData.newData.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Deletes a given event by calling the service's REMOVE method. Removes all tag associations and registers event
   * as dropped.
   * @override
   *
   * @param {object} listing
   */
  deleteListing(listing) {
    this.listingsService.remove(listing.id)
      .then(() => {
        this.removeTagAssociations(listing.uuid);
        this.registerEventDeleted(listing.id);
      })
      .catch(err => {
        displayErrorMessages('delete', `"${listing.name}"`, err,
          this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Creates associations between a given event and its tags.
   *
   * @param {int} uuid
   * @param {Array} tagList - A list of tags IDs to associate.
   */
  createTagAssociations(uuid, tagList) {
    let tagsToSave = [];

    tagList.forEach(tagUUID => tagsToSave.push({event_uuid: uuid, tag_uuid: tagUUID}));

    this.eventsTagsLookupService.create(tagsToSave)
      .catch(err => {
        const details = `Could not save tags associated with event #${uuid}.`
          + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
        this.updateMessagePanel({status: 'error', details: details});
      });
  }

  /**
   * Deletes associations between a given event and its tags.
   *
   * @param {int} uuid
   */
  removeTagAssociations(uuid) {
    this.eventsTagsLookupService.remove(null, {query: {event_uuid: uuid}})
      .catch(err => {
        const details = `Could remove tags associated with event #${uuid}.`
          + `Please re-save listing on its individual page. Error is: ${JSON.stringify(err)}`;
        this.updateMessagePanel({status: 'error', details: details});
      });
  }

  /**
   * Registers a given event as live by removing it from the dropped list and adding it to the live list.
   *
   * @param {int} id
   */
  registerEventLive(id) {
    Promise.all([
      this.liveEventsService.create({event_id: id}),
      this.deletedEventsService.remove(null, {query: {event_id: id}})
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
   * @param {int} id
   */
  registerEventDeleted(id) {
    Promise.all([
      this.deletedEventsService.create({event_id: id}),
      this.liveEventsService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event #${id} as deleted. ${JSON.stringify(err)}`
      });
    });
  }

  /**
   * Runs on filter button click. Updates the table's data to reflect the current filter.
   *
   * @param {String} filterType
   */
  updateFilters(filterType) {
    this.setState({filterLabel: filterType, currentPage: 1}, () => {
      this.fetchListings();
    });
  }

  /**
   * Creates a query that represents the current filter.
   *
   * `createFilterQuery` computes a Common API filter for use in data fetching.the new filter. Possible filter values are:
   *   * dropped - events are not present in the live list
   *   * stale - events are present in the live list, but their end dates are in the past
   *   * live - events are present in the live list, and their end dates are not in the past
   *   * default - all events
   */
  createFilterQuery() {
    const filterType = this.state.filterLabel;
    const acceptedFilters = ['dropped', 'stale', 'live'];

    if (acceptedFilters.includes(filterType)) {
      const liveIDs = this.state.liveIDs;
      if (filterType === 'dropped') return {'events.id': {$nin: liveIDs}};
      if (filterType === 'stale') return {'events.id': {$in: liveIDs}, end_date: {$lt: new Date().valueOf()}};
      if (filterType === 'live') return {'events.id': {$in: liveIDs}, end_date: {$gte: new Date().valueOf()}};
    }

    return {};
  }

  /**
   * Renders the event collection table.
   * @override
   *
   * @returns {*}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded &&
      this.state.orgsLoaded && this.state.liveIDsLoaded)) {
      return <p key={'events-message'} className={'load-message'}>Data is loading... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return [
        <Filters key={'events-filters'} updateFilters={this.updateFilters} />,
        <p key={'events-message'} className={'load-message'}>No events to list.</p>
      ];
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
        key={'events-pagination'} schema={'events'} total={this.state.listingsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <div className={'wrapper'} key={'events-table-wrapper'}>
        <table key={'events-table'} className={'schema-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
          <tbody>
          {
            this.state.listings.map(event =>
              <EventRow
                key={event.uuid} schema={'events'} listing={event}
                venues={venues} orgs={orgs}
                venue={venues.find(v => {
                  return v.uuid === event.venue_uuid
                })}
                org={orgs.find(o => {
                  return o.uuid === event.org_uuid
                })}
                updateListing={this.updateListing} deleteListing={this.deleteListing}
                createPendingListing={this.createPendingListing} listingIsLive={this.state.liveIDs.includes(event.id)}
                checkForPending={this.checkForPending}
              />
            )
          }
          </tbody>
        </table>
      </div>
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

    return <EventAddForm
      schema={'events'} venues={ this.state.venues} orgs={this.state.orgs} tags={this.state.tags}
      createListing={this.createListing} createPendingListing={this.createPendingListing}
    />;
  }
};
