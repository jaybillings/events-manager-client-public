import React from 'react';
import {arrayUnique, buildSortQuery, displayErrorMessages, printToConsole, renderTableHeader} from "../../utilities";
import {Link} from "react-router-dom";
import app from '../../services/socketio';

import EventAddForm from '../../components/events/EventAddForm';
import EventRow from "../../components/events/EventRow";
import ListingsLayout from "../../components/ListingsLayout";
import PaginationLayout from "../../components/common/PaginationLayout";
import Filters from "../../components/common/Filters";

/**
 * `EventsLayout` lays out the event collection page.
 *
 * @class
 * @child
 */
export default class EventsLayout extends ListingsLayout {
  constructor(props) {
    super(props, 'events');

    this.state = {
      ...this.state, venues: [], orgs: [], tags: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      filterType: 'none', liveIDs: [], liveIDsLoaded: false
    };

    this.defaultLimit = 3000;

    this.venuesService = app.service('venues');
    this.orgsSerivce = app.service('organizers');
    this.tagsService = app.service('tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');
    this.liveEventsService = app.service('events-live');
    this.deletedEventsService = app.service('events-deleted');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchLiveEvents = this.fetchLiveEvents.bind(this);

    this.createPendingListing = this.createPendingListing.bind(this);
    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDropped = this.registerEventDropped.bind(this);
    this.registerEventDeleted = this.registerEventDeleted.bind(this);

    this.updateFilter = this.updateFilter.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During`componentDidMount`, the component restores the table state,
   * fetches all data, and registers data service listeners.
   *
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
      .on('created', () => {
        this.updateMessagePanel({status: 'info', details: 'Event added to live list.'});
        this.fetchLiveEvents();
      })
      .on('removed', () => {
        this.updateMessagePanel({status: 'info', details: 'Event removed from live list.'});
        this.fetchLiveEvents();
      });

    this.eventsTagsLookupService
      .on('created', () => {
        this.updateMessagePanel({status: 'info', details: 'Linked tag with event.'});
      })
      .on('removed', () => {
        this.updateMessagePanel({status: 'info', details: 'Removed link between tag and event.'});
      });
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentWillUnmount`, the component unregisters data service
   * listeners and saves the table state to local storage.
   *
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
      this.eventsTagsLookupService
    ];

    secondaryServices.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('removed');
    });
  }

  /**
   * `saveQueryState` saves to localstorage data related to the data table state.
   */
  saveQueryState() {
    this.localStorageObj.put('queryState', {
      pageSize: this.state.pageSize,
      currentPage: this.state.currentPage,
      sort: this.state.sort,
      searchTerm: this.state.searchTerm,
      filterType: this.state.filterType
    });
  }

  /**
   * Fetches all data required for the view.
   *
   * @override
   */
  fetchAllData() {
   super.fetchAllData();

    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
    this.fetchLiveEvents();
  }

  /**
   * `fetchListings` fetches the event data.
   *
   * The data provided by this function is paginated and can be sorted.
   */
  fetchListings() {
    const filterQuery = this.createFilterQuery();
    const searchFilter = this.createSearchQuery();
    const currentPage = searchFilter ? 1 : this.state.currentPage;

    const query = {
      ...filterQuery,
      ...searchFilter,
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (currentPage - 1)
    };


    this.listingsService.find({query})
      .then(result => {
        console.debug(result);
        this.setState({listings: result.data, listingsTotal: result.total, listingsLoaded: true, currentPage: currentPage});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'events', err, this.updateMessagePanel, 'reload');
        this.setState({listingsLoaded: false});
      });
  }

  /**
   * `fetchVenues` fetches published venue accoding to the query.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
        this.setState({venuesLoaded: false});
      });
  }

  /**
   * `fetchOrgs` fetches data for all published organizers.
   */
  fetchOrgs() {
    this.orgsSerivce.find({query: this.defaultQuery})
      .then(message => {
        this.setState({orgs: message.data, orgsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
        this.setState({orgsLoaded: false});
      });
  }

  /**
   * `fetchTags` fetches data for all published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({tags: message.data, tagsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
        this.setState({tagsLoaded: false});
      });
  }

  /**
   * `fetchLiveEvents` fetches a list of all live events.
   */
  fetchLiveEvents() {
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
   * `createListing` creates a new event by calling the service's CREATE method. Adds the new event to the live list.
   *
   * @override
   * @param {{eventID: Number, eventObj: Object, tagsToSave: Array}} eventData
   * @returns {Promise<*>}
   */
  createListing(eventData) {
    return this.listingsService.create(eventData.eventObj)
      .then(result => {
        this.createTagAssociations(result.uuid, eventData.tagsToSave);
        this.registerEventLive(result.id);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', `"${eventData.eventObj.name}"`,
          err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `updateListing` updates a given event by calling the service's PATCH method. If required, modifies the live
   * list.
   *
   * @override
   * @param {Object} oldListing
   * @param {{newData: Object, doPublish: Boolean}} newData
   * @returns {Promise<*>}
   */
  updateListing(oldListing, newData) {
    return this.listingsService.patch(oldListing.id, newData.newData)
      .then(() => {
        if (newData.doPublish) return this.registerEventLive(oldListing.id);
        else return this.registerEventDropped(oldListing.id);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('update', `"${newData.newData.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `deleteListing` deletes a given event by calling the service's REMOVE method. Removes all tag associations and registers event
   * as deleted.
   *
   * @override
   * @param {Object} listing
   */
  deleteListing(listing) {
    this.listingsService.remove(listing.id)
      .then(() => {
        this.removeTagAssociations(listing.uuid);
        this.registerEventDeleted(listing.id, listing.uuid);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `"${listing.name}"`, err,
          this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `createPendingListing` creates a pending event listing by calling the service's CREATE method.
   *
   * @param listingData
   * @returns {Promise<{}>}
   */
  createPendingListing(listingData) {
    return this.pendingListingsService.create(listingData)
      .then(result => {
        this.setState({newPendingListing: result});
        this.updateMessagePanel({
          status: 'success',
          details: [
            <span>`Pending event "${listingData.name}" created.`</span>,
            <Link to={`/pendingevent/${result.id}`}>Click here to edit.</Link>
          ]
        });
        return this.eventsTagsLookupService.find({query: {event_uuid: this.state.listing.uuid}})
      })
      .then(result => {
        if (result.total) this.pendingEventsTagsLookupService.create(result.data);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', 'pending event from event', err, this.updateMessagePanel, 'retry');
      });

  }

  /**
   * `createTagAssociations` creates associations between an event and its tags.
   *
   * @param {int|String} uuid
   * @param {Array} tagList - A list of tags IDs to associate with the event
   */
  createTagAssociations(uuid, tagList) {
    let tagAssocData = [];

    tagList.forEach(tagUUID => tagAssocData.push({event_uuid: uuid, tag_uuid: tagUUID}));

    this.eventsTagsLookupService.create(tagAssocData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('link', `tags with event #${uuid}`, err, this.updateMessagePanel);
      });
  }

  /**
   * `remvoeTagAssociations` deletes associations between an event and its tags.
   *
   * @param {int|String} uuid
   */
  removeTagAssociations(uuid) {
    this.eventsTagsLookupService.remove(null, {query: {event_uuid: uuid}})
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('remove link', `between tag and event ${uuid}`, err, this.updateMessagePanel);
      });
  }

  /**
   * `registerEventLive` registers a given event as live via the service's CREATE method.
   *
   * @param {int} id
   */
  registerEventLive(id) {
    this.liveEventsService.create({event_id: id})
      .catch(err => {
        printToConsole(JSON.stringify(err));
        if (err.code === 'SQLITE_CONSTRAINT') return; // Benign error -- hide from user
        displayErrorMessages('add to live list', 'event', err, this.updateMessagePanel);
      });
  }

  /**
   * `registerEventDropped` registers a given event as dropped by removing it from the live list via
   * the service's REMOVE method.
   *
   * @param {int} id
   */
  registerEventDropped(id) {
    this.liveEventsService.remove(null, {query: {event_id: id}})
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('remove', 'event from live list', err, this.updateMessagePanel);
      });
  }

  /**
   * `registerEventDeleted` registers an event as deleted by adding it to the deleted list and removing
   * it from the live list.
   * @note This exists because the API needs to know when events are deleted.
   *
   * @param {int} id
   * @param {int|string} uuid
   */
  registerEventDeleted(id, uuid) {
    Promise.all([
      this.deletedEventsService.create({event_uuid: uuid}),
      this.liveEventsService.remove(null, {query: {event_id: id}})
    ])
      .catch(err => {
        printToConsole(err);
        if (err.code === 'SQLITE_CONSTRAINT') return; // Benign error -- hide from user
        displayErrorMessages('add', 'event to deleted list', err, this.updateMessagePanel);
      });
  }

  /**
   * Runs on filter button click. Updates the table's data to reflect the current filter.
   *
   * @param {String} filterType
   */
  updateFilter(filterType) {
    this.setState({filterType, currentPage: 1}, () => {
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
    const filterType = this.state.filterType;
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
   *
   * @override
   * @returns {*}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.liveIDsLoaded)) {
      return <div key={'events-message'} className={'message-compact single-message info'}>Data is loading... Please be
        patient...</div>;
    } else if (this.state.listingsTotal === 0) {
      return [
        <Filters key={'events-filters'} filterType={this.state.filterType} updateFilter={this.updateFilter} />,
        <div key={'events-message'} className={'message-compact single-message no-content'}>No events to list.</div>
      ];
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venues.name', 'Venue'],
      ['fk_orgs.name', 'Organizer'],
      ['updated_at', 'Last Modified'],
      ['is_published_NOSORT', 'Is Live?']
    ]);
    const venues = this.state.venues;
    const orgs = this.state.orgs;

    return ([
      <Filters key={'events-filters'} filterType={this.state.filterType} updateFilter={this.updateFilter} />,
      <PaginationLayout
        key={'events-pagination'} schema={'events'} total={this.state.listingsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={true}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <div className={'wrapper'} key={'events-table-wrapper'}>
        <table key={'events-table'} className={'schema-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
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
                queryForMatching={this.queryForMatching}
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
   *
   * @override
   * @returns {*}
   */
  renderAddForm() {
    if (!(this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <div className={'single-message info message-compact'}>Data is loading... Please be patient...</div>;
    }

    return <EventAddForm
      schema={'events'} venues={this.state.venues} orgs={this.state.orgs} tags={this.state.tags}
      createListing={this.createListing} createPendingListing={this.createPendingListing}
    />;
  }
};
