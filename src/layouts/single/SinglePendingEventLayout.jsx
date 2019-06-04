import React from 'react';
import app from "../../services/socketio";
import {displayErrorMessages, printToConsole, uniqueListingsOnly} from "../../utilities";

import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * SinglePendingEventLayout is a component which lays out a single pending event page.
 * @class
 * @child
 */
export default class SinglePendingEventLayout extends SinglePendingListingLayout {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param props
   */
  constructor(props) {
    super(props, 'pending-events');

    this.state = {...this.state,
      venues: [], orgs: [], tags: [], tagsForListing: [],
      pendingVenues: [], pendingOrgs: [], pendingTags: [], tagsForPendingListing: [],
      pendingVenuesLoaded: false, pendingOrgsLoaded: false, pendingTagsLoaded: false, pendingTagAssociationsLoaded: false
    };

    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.orgsService = app.service('organizers');
    this.pendingOrgsService = app.service('pending-organizers');
    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');
    this.eventsTagsLookupService = app.service('events-tags-lookup');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchTagAssociations = this.fetchTagAssociations.bind(this);
    this.fetchPendingTagAssociations = this.fetchPendingTagAssociations.bind(this);

    this.createPendingTagAssociations = this.createPendingTagAssociations.bind(this);
    this.removePendingTagAssociations = this.removePendingTagAssociations.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners and fetches data.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.venuesService, this.fetchVenues],
      [this.pendingVenuesService, this.fetchPendingVenues],
      [this.orgsService, this.fetchOrgs],
      [this.pendingOrgsService, this.fetchPendingOrgs],
      [this.tagsService, this.fetchTags],
      [this.pendingTagsService, this.fetchPendingTags]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher)
        .on('updated', () => dataFetcher)
        .on('patched', () => dataFetcher)
        .on('removed', () => dataFetcher);
    }

    this.pendingEventsTagsLookupService
      .on('created', message => {
        if (this.state.listing.uuid && (message.event_uuid === this.state.listing.uuid)) {
          this.updateMessagePanel({status: 'info', details: 'Linked tag with pending event.'});
          this.fetchPendingTagAssociations(this.state.listing.uuid);
        }
      })
      .on('removed', message => {
        if (this.state.listing.uuid && (message.event_uuid === this.state.listing.uuid)) {
          this.updateMessagePanel({status: 'info', details: 'Unlinked tag from pending event.'});
          this.fetchPendingTagAssociations(this.state.listing.uuid);
        }
      });

    this.eventsTagsLookupService
      .on('created', message => {
        if (message.event_uuid === this.state.listing.uuid) this.fetchTagAssociations(this.state.listing.uuid);
      })
      .on('removed', message => {
        if (message.event_uuid === this.state.listing.uuid) this.fetchTagAssociations(this.state.listing.uuid);
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    const services = [
      this.venuesService,
      this.pendingVenuesService,
      this.orgsService,
      this.pendingOrgsService,
      this.tagsService,
      this.pendingTagsService
    ];

    services.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });

    this.eventsTagsLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    this.pendingEventsTagsLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the page.
   *
   * @override
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchVenues();
    this.fetchPendingVenues();
    this.fetchOrgs();
    this.fetchPendingOrgs();
    this.fetchTags();
    this.fetchPendingTags();
  }

  /**
   * Fetches data for the single listings.
   * @note Unlike default, this returns a promise.
   *
   * @async
   * @override
   */
  fetchListing() {
    this.pendingListingsService.get(this.listingID)
      .then(result => {
        this.setState({listing: result, listingLoaded: true});
        this.fetchMatchingLiveListing(result.uuid);
        this.fetchPendingTagAssociations(result.uuid);
        this.fetchTagAssociations(result.uuid);
      })
      .catch(err => {
        printToConsole(err);
        this.setState({notFound: true});
      });
  }

  /**
   * Fetches published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({venues: message.data, venuesLoaded: true});
      })
      .catch(err => {
        this.setState({venuesLoaded: false});
        displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({pendingVenues: message.data, pendingVenuesLoaded: true});
      })
      .catch(err => {
        this.setState({pendingVenuesLoaded: false});
        displayErrorMessages('fetch', 'pending venues', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({orgs: message.data, orgsLoaded: true});
      })
      .catch(err => {
        this.setState({orgsLoaded: false});
        displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
      })
      .catch(err => {
        this.setState({pendingOrgsLoaded: false});
        displayErrorMessages('fetch', 'pending organizers', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({tags: message.data, tagsLoaded: true});
      })
      .catch(err => {
        this.setState({tagsLoaded: false});
        displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches pending tags.
   */
  fetchPendingTags() {
    this.pendingTagsService.find({query: this.defaultQuery})
      .then(result => {
        this.setState({pendingTags: result.data, pendingTagsLoaded: true});
      })
      .catch(err => {
        this.setState({pendingTagsLoaded: false});
        displayErrorMessages('fetch', 'pending tags', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Fetches associations between a published event and published tags.
   *
   * @param {string|number} eventUUID
   */
  fetchTagAssociations(eventUUID) {
    this.eventsTagsLookupService.find({query: {event_uuid: eventUUID}})
      .then(result => {
        this.setState({tagsForListing: result.data, tagAssociationsLoaded: true});
      })
      .catch(err => {
        this.setState({tagAssociationsLoaded: false});
        printToConsole(err);
      });
  }

  /**
   * Fetches associations between a pending event and all tags (published or pending).
   *
   * @param {string|number} eventUUID
   */
  fetchPendingTagAssociations(eventUUID) {
    this.pendingEventsTagsLookupService.find({query: {event_uuid: eventUUID}})
      .then(result => {
        this.setState({tagsForPendingListing: result.data, pendingTagAssociationsLoaded: true});
      })
      .catch(err => {
        this.setState({pendingTagAssociationsLoaded: false});
        displayErrorMessages('fetch', 'associations between tags and pending events', err, this.updateMessagePanel, 'reload');
        printToConsole(err);
      });
  }

  /**
   * Determines whether the listing may duplicate an existing listing.
   * @override
   * @async
   *
   * @returns {Promise}
   */
  queryForDuplicate() {
    return this.listingsService.find({
      query: {
        $or: [
          {uuid: this.state.listing.uuid},
          {
            name: this.state.listing.name,
            start_date: this.state.listing.start_date,
            end_date: this.state.listing.end_date
          }
        ],
        $select: ['uuid']
      }
    });
  }

  /**
   * Updates the event's data by calling the service's PATCH method.
   * @override
   *
   * @param {object} listingData
   */
  updateListing(listingData) {
    this.pendingListingsService.patch(this.listingID, listingData.eventData).then(result => {
      if (listingData.tagsToSave) this.createPendingTagAssociations(listingData.tagsToSave);
      if (listingData.tagsToRemove) this.removePendingTagAssociations(listingData.tagsToRemove);

      this.setState({listing: result, listingLoaded: true});
      this.updateMessagePanel({status: 'success', details: `Saved changes to "${result.name}"`});
    }, err => {
      displayErrorMessages('save changes to', this.state.listing.name, err, this.updateMessagePanel, 'retry');
    });
  }

  /**
   * Deletes the pending event by calling the service's REMOVE method.
   * @override
   */
  deleteListing() {
    this.pendingListingsService
      .remove(this.listingID)
      .then((result) => {
        this.pendingEventsTagsLookupService.remove(null, {query: {event_uuid: result.uuid}});
        this.setState({hasDeleted: true});
      })
      .catch(err => {
        displayErrorMessages('delete', `"${this.state.listing.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Creates associations between tags and pending event.
   *
   * @param {object[]} tagsToSave
   */
  createPendingTagAssociations(tagsToSave) {
    this.pendingEventsTagsLookupService
      .create(tagsToSave)
      .catch(err => {
        displayErrorMessages('create', 'event-tag link', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Deletes associations between tags and the pending event.
   *
   * @param {object[]} tagsToRemove
   */
  removePendingTagAssociations(tagsToRemove = null) {
    const query = {event_uuid: this.state.listing.uuid};
    if (tagsToRemove) query.tag_uuid = {$in: tagsToRemove};

    this.pendingEventsTagsLookupService
      .remove(null, {query: query})
      .catch(err => {
        displayErrorMessages('remove', 'event-tag link', err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * Renders the single pending event's record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.matchingListingLoaded && this.state.pendingVenuesLoaded
      && this.state.pendingOrgsLoaded && this.state.pendingTagsLoaded && this.state.pendingTagAssociationsLoaded)) {
      return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;
    }

    const uniqueVenues = uniqueListingsOnly(this.state.venues, this.state.pendingVenues);
    const uniqueOrgs = uniqueListingsOnly(this.state.orgs, this.state.pendingOrgs);
    const uniqueTags = uniqueListingsOnly(this.state.tags, this.state.pendingTags);

    return <PendingEventRecord
      schema={this.schema} listing={this.state.listing} matchingLiveListing={this.state.matchingLiveListing}
      venues={uniqueVenues} orgs={uniqueOrgs} tags={uniqueTags}
      tagsForListing={this.state.tagsForListing.map(row => row.tag_uuid)}
      tagsForPendingListing={this.state.tagsForPendingListing.map(row => row.tag_uuid)}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForDuplicate={this.queryForDuplicate}
    />;
  }
};
