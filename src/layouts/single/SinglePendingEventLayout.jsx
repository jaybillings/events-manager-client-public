import React from 'react';
import app from "../../services/socketio";
import {displayErrorMessages, printToConsole, uniqueListingsOnly} from "../../utilities";

import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import SinglePendingListingLayout from "../../components/SinglePendingListingLayout";

/**
 * SinglePendingEventLayout lays out the single pending event view.
 *
 * @class
 * @child
 */
export default class SinglePendingEventLayout extends SinglePendingListingLayout {
  constructor(props) {
    super(props, 'pending-events');

    this.state = {
      ...this.state,
      venues: [],
      orgs: [],
      tags: [],
      tagsForListing: [],
      pendingVenues: [],
      pendingOrgs: [],
      pendingTags: [],
      tagsForPendingListing: [],
      pendingVenuesLoaded: false,
      pendingOrgsLoaded: false,
      pendingTagsLoaded: false,
      pendingTagAssociationsLoaded: false
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
          this.updateMessagePanel({status: 'info', details: `Linked tag ${message.tag_uuid} with pending event.`});
          this.fetchPendingTagAssociations(this.state.listing.uuid);
        }
      })
      .on('removed', message => {
        if (this.state.listing.uuid && (message.event_uuid === this.state.listing.uuid)) {
          this.updateMessagePanel({status: 'info', details: `Unlinked tag ${message.tag_uuid} from pending event.`});
          this.fetchPendingTagAssociations(this.state.listing.uuid);
        }
      });

    this.eventsTagsLookupService
      .on('created', message => {
        if (this.state.listing.uuid && (message.event_uuid === this.state.listing.uuid)) {
          this.fetchTagAssociations(this.state.listing.uuid);
        }
      })
      .on('removed', message => {
        if (this.state.listing.uuid && (message.event_uuid === this.state.listing.uuid)) {
          this.fetchTagAssociations(this.state.listing.uuid);
        }
      });
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
   * `fetchAllData` fetches all data required for the view.
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
   * `fetchListing` fetches data for the single listing and saves it to the state.
   *
   * For pending events, once the listing is returned `fetchListing` also fetches
   * the tag associations, matching published listing, and the published listing's tag associations.
   *
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
   * `fetchVenues` fetches published venues and saves them to the state.
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
   * `fetchPendingVenues` fetches pending venues and saves them to the state.
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
   * `fetchOrgs` fetches published organizers and saves them to the state.
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
   * `fetchPendingOrgs` fetches pending organizers  and saves them to the state.
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
   * `fetchTags` fetches published tags and saves them to the state.
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
   * `fetchPendingTags` fetches pending tags and saves them to the state.
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
   * `fetchTagAssociations` fetches associations between a published event and
   * published tags. These are saved to the state.
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
   * `fetchPendingTagAssociations` fetches associations between a pending event
   * and all tags (published or pending). These are saved to the state.
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
   * `queryForDuplicate` queries the published events table for listings that may
   * duplicate the pending listing.
   *
   * In the case of the events, it matches against a combination of name,
   * start date, and end date (since many valid events might have the same name but different dates).
   *
   * @override
   * @async
   * @returns {Promise<*>}
   */
  queryForDuplicate() {
    return this.listingsService.find({
      query: {
        name: this.state.listing.name,
        start_date: this.state.listing.start_date,
        end_date: this.state.listing.end_date,
        $select: ['uuid']
      }
    });
  }

  /**
   * `updateListing` updates the event's data by calling the service's PATCH method. The new data
   * is saved to the state.
   *
   * @override
   * @param {object} listingData
   */
  updateListing(listingData) {
    this.pendingListingsService.patch(this.listingID, listingData.eventData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('save changes to', this.state.listing.name, err, this.updateMessagePanel, 'retry');
      });

    if (listingData.tagsToSave) this.createPendingTagAssociations(listingData.tagsToSave);
    if (listingData.tagsToRemove) this.removePendingTagAssociations(listingData.tagsToRemove);
  }

  /**
   * `deleteListing` removes the listing by calling the service's REMOVE method.
   *
   * @override
   */
  deleteListing() {
    this.pendingListingsService.remove(this.listingID)
      .then((result) => {
        this.pendingEventsTagsLookupService.remove(null, {query: {event_uuid: result.uuid}});
        this.setState({hasDeleted: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `"${this.state.listing.name}"`, err, this.updateMessagePanel, 'retry');
      });
  }

  /**
   * `createPendingTagAssociations` creates associations between tags and the
   * pending event.
   *
   * @param {object[]} tagsToSave
   */
  createPendingTagAssociations(tagsToSave) {
    this.pendingEventsTagsLookupService
      .create(tagsToSave)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', 'event-tag link', err, this.updateMessagePanel);
      });
  }

  /**
   * `removePendingTagAssociations` deletes associations between tags and the
   * pending event.
   *
   * @param {object[]} tagsToRemove
   */
  removePendingTagAssociations(tagsToRemove = null) {
    const query = {event_uuid: this.state.listing.uuid};
    if (tagsToRemove) query.tag_uuid = {$in: tagsToRemove};

    this.pendingEventsTagsLookupService
      .remove(null, {query: query})
      .catch(err => {
        displayErrorMessages('remove', 'event-tag link', err, this.updateMessagePanel);
      });
  }

  /**
   * `renderRecord` renders the single pending event's record.
   *
   * @override
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
