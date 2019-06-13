import React from "react";
import {displayErrorMessages, printToConsole} from "../../utilities";
import app from "../../services/socketio";

import EventRecord from "../../components/events/EventRecord";
import SingleListingLayout from "../../components/SingleListingLayout";

/**
 * `SingleEventLayout` lays out a single event page.
 *
 * @class
 * @child
 */
export default class SingleEventLayout extends SingleListingLayout {
  constructor(props) {
    super(props, 'events');

    this.state = {
      ...this.state,
      publishState: '', venues: [], orgs: [], tags: [], tagsForListing: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false, tagAssociationsLoaded: false
    };

    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.liveEventsService = app.service('events-live');
    this.deletedEventsService = app.service('events-deleted');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchTagAssociations = this.fetchTagAssociations.bind(this);
    this.fetchLiveStatus = this.fetchLiveStatus.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDropped = this.registerEventDropped.bind(this);
    this.registerEventDeleted = this.registerEventDeleted.bind(this);
  }

  /**
   * Runs once the component mounts.
   *
   * During `componentDidMount`, the component fetches required data and
   * registers service listeners.
   *
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
        .on('created', () => dataFetcher)
        .on('patched', () => dataFetcher)
        .on('updated', () => dataFetcher)
        .on('removed', () => dataFetcher);
    }

    this.liveEventsService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to live list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from live list.'}));

    this.deletedEventsService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to deleted list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from deleted list'}));
  }

  /**
   * Runs when the component unmounts.
   *
   * During `componentWillUnmount`, the component unregisters service listeners.
   *
   * @override
   */
  componentWillUnmount() {
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
      this.liveEventsService,
      this.deletedEventsService
    ];

    otherServices.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('removed');
    });
  }

  /**
   * `fetchAllData` fetches all data required for the view.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
    this.fetchLiveStatus();
  }

  /**
   * fetchListing` fetches data for the single listing and saves it to the state.
   *
   * For events, it also fetches the tag associations.
   */
  fetchListing() {
    this.listingsService.get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.fetchTagAssociations(result.uuid);
      })
      .catch(err => {
        printToConsole(err);
        this.setState({notFound: true});
      });
  }

  /**
   * `fetchVenues` fetches published venues and saves them to the state.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        this.setState({venuesLoaded: false});
        displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * `fetchOrgs` fetches published organizers and saves them to the state.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({orgs: result.data, orgsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        this.setState({orgsLoaded: false});
        displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * `fetchTags` fetches published tags and saves them to the state.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({tags: result.data, tagsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        this.setState({tagsLoaded: false});
        displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * `fetchTagAssociations` fetches links between published tags and the event and saves them to the state.
   */
  fetchTagAssociations(eventUUID) {
    this.eventsTagsLookupService.find({query: {event_uuid: eventUUID}})
      .then(result => {
        this.setState({tagsForListing: result.data, tagAssociationsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        this.setState({tagAssociationsLoaded: false});
        displayErrorMessages('fetch', 'associations between tags and events', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * `fetchLiveStatus` checks for the presence of the listing in the live lookup table.
   */
  fetchLiveStatus() {
    this.liveEventsService.find({query: {event_id: this.listingID}})
      .then(result => {
        const publishState = result.total > 0 ? 'live' : 'dropped';
        this.setState({publishState});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'event\'s publish status', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * `updateListing` updates the event's data by calling the service's PATCH method.
   *
   * For events, it also updates tag associations and changes the live state, if necessary.
   *
   * @override
   * @param {object} listingData
   */
  updateListing(listingData) {
    this.listingsService.patch(this.listingID, listingData.eventData)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});

        if (listingData.publishState === 'publish') this.registerEventLive();
        else if (listingData.publishState === 'drop') this.registerEventDropped();

        return this.removeTagAssociations();
      })
      .then(() => {
        this.updateMessagePanel({status: 'info', details: 'Saved tag associations for event.'});
        if (listingData.tagsToSave) this.createTagAssociations(listingData.tagsToSave);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('save changes to', this.state.listing.name, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `deleteListing` deletes the event by calling the service's REMOVE method.
   *
   * For events, it also removes tag associations and registers the event as deleted.
   *
   * @override
   */
  deleteListing() {
    this.listingsService.remove(this.listingID)
      .then(() => {
        this.setState({hasDeleted: true});
        this.removeTagAssociations();
        this.registerEventDeleted();
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', this.state.listing.name, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `createTagAssociations` creates associations between tags and event.
   *
   * @param {object} newTagData
   */
  createTagAssociations(newTagData) {
    this.eventsTagsLookupService.create(newTagData)
      .catch(err => {
        printToConsole(err);
        if (err.code === 'SQLITE_CONSTRAINT') return; // Benign error -- hide from user
        displayErrorMessages('associate', 'tags with event', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `removeTagAssociations` deletes all associations between tags and the event.
   */
  removeTagAssociations() {
    this.eventsTagsLookupService.remove(null, {query: {event_uuid: this.state.listing.uuid}})
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('de-associate', 'tags from event', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `registerEventLive` registers event as live by removing it from the deleted list and adding it to the live list.
   */
  registerEventLive() {
    Promise.all([
      this.liveEventsService.create({event_id: this.state.listing.id}),
      this.deletedEventsService.remove(null, {query: {event_uuid: this.state.listing.uuid}})
    ])
      .catch(err => {
        printToConsole(err);
        if (err.code === 'SQLITE_CONSTRAINT') return; // Benign error -- hide from user
        displayErrorMessages('register', 'event as live', err, this.updateMessagePanel);
      });
  }

  /**
   * `registerEventDropped` registers the event as dropped by removing it from the live list.
   */
  registerEventDropped() {
    this.liveEventsService.remove(null, {query: {event_id: this.state.listing.id}})
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('remove', 'event from dropped list', err, this.updateMessagePanel);
      });
  }

  /**
   * `registerEventDeleted` registers an event as deleted by removing it from the
   * live list and adding it to the deleted list.
   */
  registerEventDeleted() {
    Promise.all([
      this.deletedEventsService.create({event_uuid: this.state.listing.uuid}),
      this.liveEventsService.remove(null, {query: {event_id: this.state.listing.id}})
    ])
      .catch(err => {
        printToConsole(err);
        if (err.code === 'SQLITE_CONSTRAINT') return; // Benign error -- hide from user
        displayErrorMessages('register', 'event as deleted', err, this.updateMessagePanel);
      });
  }

  /**
   * Renders the event's record.
   *
   * @override
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded
      && this.state.tagAssociationsLoaded)) {
      return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;
    }

    return <EventRecord
      listing={this.state.listing} schema={this.schema} publishState={this.state.publishState}
      venues={this.state.venues} orgs={this.state.orgs}
      tags={this.state.tags} tagsForListing={this.state.tagsForListing.map(row => row.tag_uuid)}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />;
  }
};
