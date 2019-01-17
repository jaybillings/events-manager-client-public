import React from "react";
import app from "../../services/socketio";

import EventRecord from "../../components/events/EventRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SingleEventLayout is a component which lays out a single event page.
 * @class
 * @child
 */
export default class SingleEventLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'events');

    Object.assign(this.state, {
      venues: [], orgs: [], tags: [], tagsForListing: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false, tagAssociationsLoaded: false
    });

    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.liveEventService = app.service('events-live');
    this.droppedEventService = app.service('events-dropped');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchTagAssociations = this.fetchTagAssociations.bind(this);
    this.checkForLive = this.checkForLive.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);

    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDropped = this.registerEventDropped.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners and fetches data.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.venuesService, this.fetchVenues],
      [this.orgsService, this.fetchOrgs],
      [this.tagsService, this.fetchTags]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', dataFetcher)
        .on('patched', dataFetcher)
        .on('updated', dataFetcher)
        .on('removed', dataFetcher);
    }

    this.liveEventService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to live list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from live list.'}));

    this.droppedEventService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to dropped list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from dropped list'}));

    this.eventsTagsLookupService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Linked tag with event.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Unlinked tag from event.'}));
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    const services = [
      this.venuesService,
      this.orgsService,
      this.tagsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });

    const otherServices = [
      this.liveEventService,
      this.droppedEventService,
      this.eventsTagsLookupService
    ];

    otherServices.forEach(service => {
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
    this.fetchListing();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
    this.fetchTagAssociations();
  }

  /**
   * Fetches published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true})
    }, err => {
      console.log('fetch venue error', JSON.stringify(err));
      this.setState({venuesLoaded: false});
    });
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true})
    }, err => {
      console.log('fetch org error', JSON.stringify(err));
      this.setState({orgsLoaded: false});
    });
  }

  /**
   * Fetches published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    }, err => {
      console.log('find tags error', JSON.stringify(err));
      this.setState({tagsLoaded: false});
    });
  }

  /**
   * Fetches associations between published tags and the event.
   */
  fetchTagAssociations() {
    this.eventsTagsLookupService.find({query: {event_id: this.state.listing.id}, $select: ['tag_id']}).then(message => {
      this.setState({tagsForListing: message.data, tagAssociationsLoaded: true});
    }, err => {
      console.log('find tags associations error', JSON.stringify(err));
      this.setState({tagAssociationsLoaded: false});
    });
  }

  /**
   * Checks for event's presence in the live list
   * @async
   * @returns {Promise}
   */
  checkForLive() {
    return this.liveEventService.find({query: {event_id: this.state.listing.id}});
  }

  /**
   * Creates associations between tags and event.
   * @param {object[]} tagsToSave
   */
  createTagAssociations(tagsToSave) {
    this.eventsTagsLookupService.create(tagsToSave).catch(err => {
      const details = 'Could not associate tags with event. Please re-save listing. ' +
        `Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Deletes associations between tags and the event.
   * @param {object[]} tagsToRemove
   */
  removeTagAssociations(tagsToRemove) {
    const query = tagsToRemove ? {event_id: {$in: tagsToRemove}} : {};

    this.eventsTagsLookupService.remove(null, {query: query}).catch(err => {
      const details = 'Could not de-associate tags from event. Please re-save listing. '
        + `Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Registers event as live by removing it from the dropped list and adding it to the live list.
   */
  registerEventLive() {
    const id = this.state.listing.id;

    //noinspection JSCheckFunctionSignatures
    Promise.all([
      this.liveEventService.create({event_id: id}),
      this.droppedEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event as live. Error is: ${JSON.stringify(err)}`
      });
    });
  }

  /**
   * Register event as dropped by removing it from the live list and adding it to the dropped list.
   */
  registerEventDropped() {
    const id = this.state.listing.id;

    // noinspection JSCheckFunctionSignatures
    Promise.all([
      this.droppedEventService.create({event_id: id}),
      this.liveEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event as live. Error is: ${JSON.stringify(err)}`
      });
    });
  }

  /**
   * Updates the event's data by calling the service's PATCH method.
   * @override
   * @param {object} listingData
   */
  updateListing(listingData) {
    this.listingsService.patch(this.state.listing.id, listingData.eventData).then(() => {
      if (listingData.tagsToSave) this.createTagAssociations(listingData.tagsToSave);
      if (listingData.tagsToRemove) this.removeTagAssociations(listingData.tagsToRemove);

      if (listingData.publishState === 'publish') this.registerEventLive();
      else if (listingData.publishState === 'drop') this.registerEventDropped();
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Deletes the event by calling the service's REMOVE method.
   * @override
   */
  deleteListing() {
    this.listingsService.remove(this.state.listing.id).then(() => {
      // noinspection JSCheckFunctionSignatures
      Promise.all([
        this.removeTagAssociations([]),
        this.registerEventDropped()
      ]).then(() => {
        this.setState({hasDeleted: true});
      }, err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
    });
  }

  /**
   * Renders the single event's record.
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded
      && this.state.tagAssociationsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventRecord
      listing={this.state.listing} venues={this.state.venues} orgs={this.state.orgs}
      tags={this.state.tags} tagsForListing={this.state.tagsForListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} checkForLive={this.checkForLive}
    />;
  }
};
