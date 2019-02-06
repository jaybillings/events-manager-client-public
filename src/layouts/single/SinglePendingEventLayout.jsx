import React from 'react';
import app from "../../services/socketio";
import {displayErrorMessages, uniqueListingsOnly} from "../../utilities";

import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SinglePendingEventLayout is a component which lays out a single pending event page.
 * @class
 * @child
 */
export default class SinglePendingEventLayout extends SingleListingLayoutUniversal {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param props
   */
  constructor(props) {
    super(props, 'pending-events');

    Object.assign(this.state, {
      venues: [], orgs: [], tags: [], pendingVenues: [], pendingOrgs: [], pendingTags: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      pendingVenuesLoaded: false, pendingOrgsLoaded: false, pendingTagsLoaded: false, tagAssociationsLoaded: false
    });

    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.orgsService = app.service('organizers');
    this.pendingOrgsService = app.service('pending-organizers');
    this.tagsService = app.service('tags');
    this.pendingTagsService = app.service('pending-tags');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchPendingTags = this.fetchPendingTags.bind(this);
    this.fetchTagAssociations = this.fetchTagAssociations.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
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
        .on('created', dataFetcher)
        .on('updated', dataFetcher)
        .on('patched', dataFetcher)
        .on('removed', dataFetcher);
    }

    this.pendingEventsTagsLookupService
      .on('created', message => {
        if (message.pending_event_id === this.listingID) {
          this.updateMessagePanel({status: 'info', details: 'Linked tag with pending event.'});
        }
      })
      .on('removed', message => {
        if (message.pending_event_id === this.listingID) {
          this.updateMessagePanel({status: 'info', details: 'Unlinked tag from pending event.'});
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

    this.pendingEventsTagsLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the page.
   * @override
   */
  fetchAllData() {
    super.fetchAllData();

    this.fetchVenues();
    this.fetchPendingVenues();
    this.fetchOrgs();
    this.fetchPendingOrgs();
    this.fetchTags();
    this.fetchPendingTags();
    this.fetchTagAssociations();
  }

  /**
   * Fetches published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    }, err => {
      this.setState({venuesLoaded: false});
      displayErrorMessages('fetch', 'venues', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingVenues: message.data, pendingVenuesLoaded: true});
    }, err => {
      this.setState({pendingVenuesLoaded: false});
      displayErrorMessages('fetch', 'pending venues', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    }, err => {
      this.setState({orgsLoaded: false});
      displayErrorMessages('fetch', 'organizers', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    }, err => {
      this.setState({pendingOrgsLoaded: false});
      displayErrorMessages('fetch', 'pending organizers', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    }, err => {
      this.setState({tagsLoaded: false});
      displayErrorMessages('fetch', 'tags', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches pending tags.
   */
  fetchPendingTags() {
    this.pendingTagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingTags: message.data, pendingTagsLoaded: true})
    }, err => {
      this.setState({pendingTagsLoaded: false});
      displayErrorMessages('fetch', 'pending tags', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Fetches associations between all tags (published or pending) and the pending event.
   */
  fetchTagAssociations() {
    this.pendingEventsTagsLookupService.find({
      query: {pending_event_id: this.props.match.params.id},
      $select: ['tag_uuid']
    }).then(message => {
      this.setState({tagsForListing: message.data, tagAssociationsLoaded: true});
    }, err => {
      this.setState({tagAssociationsLoaded: false});
      displayErrorMessages('fetch', 'associations between tags and pending events', err, this.updateMessagePanel, 'reload');
    });
  }

  /**
   * Determines whether the listing may duplicate an existing listing.
   * @override
   * @async
   *
   * @returns {Promise}
   */
  queryForExisting() {
    return this.listingsService.find({
      query: {
        $or: [{uuid: this.state.listing.uuid}, {description: this.state.listing.description}, {
          name: this.state.listing.name,
          start_date: this.state.listing.start_date,
          end_date: this.state.listing.end_date
        }],
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
    this.listingsService.patch(this.listingID, listingData.eventData).then(() => {
      if (listingData.tagsToSave) this.createTagAssociations(listingData.tagsToSave);
      if (listingData.tagsToRemove) this.removeTagAssociations(listingData.tagsToRemove);
    }, err => {
      displayErrorMessages('save changes to', this.state.listing.name, err, this.updateMessagePanel, 'retry');
    });
  }

  /**
   * Deletes the pending event by calling the service's REMOVE method.
   * @override
   */
  deleteListing() {
    this.listingsService.remove(this.listingID).then(() => {
      this.removeTagAssociations([]).then(() => {
        this.setState({hasDeleted: true});
      });
    }, err => {
      displayErrorMessages('delete', this.state.listing.name, err, this.updateMessagePanel, 'retry');
    });
  }

  /**
   * Creates associations between tags and pending event.
   *
   * @param {object[]} tagsToSave
   */
  createTagAssociations(tagsToSave) {
    this.pendingEventsTagsLookupService.create(tagsToSave).catch(err => {
      displayErrorMessages('associate', 'tags with pending event', err, this.updateMessagePanel, 'retry');
    });
  }

  /**
   * Deletes associations between tags and the pending event.
   *
   * @param {object[]} tagsToRemove
   */
  removeTagAssociations(tagsToRemove) {
    const query = tagsToRemove ? {pending_event_id: {$in: tagsToRemove}} : {};

    this.pendingEventsTagsLookupService.remove(null, {query: query}).catch(err => {
      displayErrorMessages('de-associate', 'tags from pending event', err, this.updateMessagePanel, 'retry');
    });
  }

  /**
   * Renders the single pending event's record.
   * @override
   *
   * @returns {*}
   */
  renderRecord() {
    if (!(this.state.listingLoaded && this.state.venuesLoaded && this.state.pendingVenuesLoaded
      && this.state.orgsLoaded && this.state.pendingOrgsLoaded && this.state.tagsLoaded && this.state.pendingTagsLoaded
      && this.state.tagAssociationsLoaded)) {
      return <p>Data is loading ... Please be patient...</p>;
    }

    const uniqueVenues = uniqueListingsOnly(this.state.venues, this.state.pendingVenues);
    const uniqueOrgs = uniqueListingsOnly(this.state.orgs, this.state.pendingOrgs);
    const uniqueTags = uniqueListingsOnly(this.state.tags, this.state.pendingTags);

    return <PendingEventRecord
      listing={this.state.listing} schema={this.schema} venues={uniqueVenues} orgs={uniqueOrgs}
      tags={uniqueTags} tagsForListing={this.state.tagsForListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />;
  }
};
