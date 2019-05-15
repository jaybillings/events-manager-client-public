import React from "react";
import app from "../../services/socketio";

import EventRecord from "../../components/events/EventRecord";
import SingleListingLayout from "../../components/SingleListingLayout";
import {displayErrorMessages} from "../../utilities";

/**
 * SingleEventLayout is a component which lays out a single event page.
 * @class
 * @child
 */
export default class SingleEventLayout extends SingleListingLayout {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {object} props
   */
  constructor(props) {
    super(props, 'events');

    Object.assign(this.state, {
      publishState: '', venues: [], orgs: [], tags: [], tagsForListing: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false, tagAssociationsLoaded: false
    });

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

    this.eventsTagsLookupService
      .on('created', message => {
        if (message.event_id === this.listingID) {
          this.updateMessagePanel({status: 'info', details: 'Saved tags associated with event.'})
        }
      })
      .on('removed', message => {
        if (message.event_id === this.listingID) {
          this.updateMessagePanel({status: 'info', details: 'Removed tags from event.'})
        }
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
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
      this.deletedEventsService,
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
    this.fetchLiveStatus();
  }

  fetchListing() {
    return app.service(this.schema).get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.fetchTagAssociations(result.uuid);
      })
      .catch(errors => {
        this.setState({notFound: true});
        displayErrorMessages('fetch', `${this.schema} #${this.listingID}`, errors, this.updateMessagePanel);
      });
  }

  /**
   * Fetches published venues.
   * @async
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        this.setState({venuesLoaded: false});
        displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * Fetches published organizers.
   * @async
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({orgs: result.data, orgsLoaded: true});
      })
      .catch(err => {
        this.setState({orgsLoaded: false});
        displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * Fetches published tags.
   * @async
   */
  fetchTags() {
    return this.tagsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({tags: result.data, tagsLoaded: true});
      })
      .catch(err => {
        this.setState({tagsLoaded: false});
        displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * Fetches associations between published tags and the event.
   * @async
   */
  fetchTagAssociations(eventUUID) {
    this.eventsTagsLookupService.find({query: {event_uuid: eventUUID}})
      .then(result => {
        this.setState({tagsForListing: result.data, tagAssociationsLoaded: true});
      })
      .catch(err => {
        this.setState({tagAssociationsLoaded: false});
        displayErrorMessages('fetch', 'associations between tags and events', err, this.updateMessagePanel, 'reload');
      });
  }

  /**
   * Checks for the presence of the listing in the live lookup table.
   * @async
   */
  fetchLiveStatus() {
    this.liveEventsService.find({query: {event_id: this.listingID}})
      .then(result => {
        const publishState = result.total > 0 ? 'live' : 'dropped';
        this.setState({publishState});
      }, err => {
        console.log('error in checking live status', JSON.stringify(err));
      });
  }

  /**
   * Updates the event's data by calling the service's PATCH method.
   * @override
   *
   * @param {object} listingData
   */
  updateListing(listingData) {
    console.log('~ in updatelisting!', listingData);
    this.listingsService.patch(this.listingID, listingData.eventData)
      .then(result => {
        console.log('~ event saved!', result);

        this.setState({listing: result, listingLoaded: true});
        this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}"`});

        this.removeTagAssociations().then(() => {
          console.log('tag associations removed');
          if (listingData.tagsToSave) this.createTagAssociations(listingData.tagsToSave);
        });

        if (listingData.publishState === 'publish') this.registerEventLive();
        else if (listingData.publishState === 'drop') this.registerEventDropped();
      })
      .catch(err => {
        displayErrorMessages('save changes to', this.state.listing.name, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Deletes the event by calling the service's REMOVE method.
   * @override
   */
  deleteListing() {
    this.listingsService.remove(this.listingID)
      .then(() => {
        this.setState({hasDeleted: true});
        return Promise.all([
          this.removeTagAssociations(),
          this.registerEventDeleted()
        ]);
      })
      .catch(err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        displayErrorMessages('delete', this.state.listing.name, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Creates associations between tags and event.
   * @async
   *
   * @param {object} newTagData
   * @returns {Promise<any>}
   */
  createTagAssociations(newTagData) {
    return this.eventsTagsLookupService.create(newTagData)
      .catch(err => {
        displayErrorMessages('associate', 'tags with event', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Deletes all associations between tags and the event.
   * @async
   *
   * @returns {Promise<*>}
   */
  removeTagAssociations() {
    return this.eventsTagsLookupService.remove(null, {query: {event_uuid: this.state.listing.uuid}})
      .catch(err => {
        displayErrorMessages('de-associate', 'tags from event', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Registers event as live by removing it from the dropped list and adding it to the live list.
   */
  registerEventLive() {
    Promise
      .all([
        this.liveEventsService.create({event_id: this.listingID}),
        this.deletedEventsService.remove(null, {query: {event_id: this.listingID}})
      ])
      .catch(err => {
        displayErrorMessages('register', 'event as live', err, this.updateMessagePanel);
      });
  }

  /**
   * Register event as dropped by removing it from the live list.
   *
   * @returns {Promise<*>}
   */
  registerEventDropped() {
    return this.liveEventsService
      .remove(null, {query: {event_id: this.listingID}})
      .catch(err => {
        displayErrorMessages('remove', 'event from dropped list', err, this.updateMessagePanel);
      });
  }

  /**
   * Register an event as deleted by removing it from the live list and adding it to the deleted list.
   *
   * @returns {Promise<*>}
   */
  registerEventDeleted() {
    return Promise
      .all([
        this.deletedEventsService.create({event_id: this.listingID}),
        this.liveEventsService.remove(null, {query: {event_id: this.listingID}})
      ])
      .catch(err => {
        displayErrorMessages('register', 'event as deleted', err, this.updateMessagePanel);
      });
  }

  /**
   * Renders the single event's record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded
      && this.state.tagAssociationsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventRecord
      listing={this.state.listing} schema={this.schema} publishState={this.state.publishState}
      venues={this.state.venues} orgs={this.state.orgs}
      tags={this.state.tags} tagsForListing={this.state.tagsForListing.map(row => row.tag_uuid)}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />;
  }
};
