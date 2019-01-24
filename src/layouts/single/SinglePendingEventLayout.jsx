import React from 'react';
import app from "../../services/socketio";

import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import {uniqueListingsOnly} from "../../utilities";

/**
 * SinglePendingEventLayout is a component which lays out a single pending event page.
 * @class
 * @child
 */
export default class SinglePendingEventLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
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
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Linked tag with pending event.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Unlinked tag from event'}));
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

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
    this.fetchListing();
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
      console.log('fetch venue error', JSON.stringify(err));
      this.setState({venuesLoaded: false});
    });
  }

  /**
   * Fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingVenues: message.data, pendingVenuesLoaded: true});
    }, err => {
      console.log('fetch pending venue error', JSON.stringify(err));
      this.setState({pendingVenuesLoaded: false});
    });
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    }, err => {
      console.log('fetch org error', JSON.stringify(err));
      this.setState({orgsLoaded: false});
    });
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    }, err => {
      console.log('fetch pending org error', JSON.stringify(err));
      this.setState({pendingOrgsLoaded: false});
    });
  }

  /**
   * Fetches published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    }, err => {
      console.log('fetch tag error', JSON.stringify(err));
      this.setState({tagsLoaded: false});
    });
  }

  /**
   * Fetches pending tags.
   */
  fetchPendingTags() {
    this.pendingTagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingTags: message.data, pendingTagsLoaded: true})
    }, err => {
      console.log('fetch pending tags error', JSON.stringify(err));
      this.setState({pendingTagsLoaded: false});
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
      console.log('fetch tag associations error', JSON.stringify(err));
      this.setState({tagAssociationsLoaded: false});
    });
  }

  /**
   * Determines whether the listing may duplicate an existing listing.
   * @override
   * @async
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
   * Creates associations between tags and pending event.
   * @param {object[]} tagsToSave
   */
  createTagAssociations(tagsToSave) {
    this.pendingEventsTagsLookupService.create(tagsToSave).catch(err => {
      const details = 'Could not associate tags with event. Please re-save listing. ' +
        `Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Deletes associations between tags and the pending event.
   * @param {object[]} tagsToRemove
   */
  removeTagAssociations(tagsToRemove) {
    const query = tagsToRemove ? {pending_event_id: {$in: tagsToRemove}} : {};

    this.pendingEventsTagsLookupService.remove(null, {query: query}).catch(err => {
      const details = 'Could not de-associate tags from event. Please re-save listing. '
        + `Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
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
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Deletes the pending event by calling the service's REMOVE method.
   * @override
   */
  deleteListing() {
    this.listingsService.remove(this.state.listing.id).then(() => {
      this.removeTagAssociations([]).then(() => {
        this.setState({hasDeleted: true});
      });
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Renders the single pending event's record.
   * @override
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
      listing={this.state.listing} venues={uniqueVenues} orgs={uniqueOrgs}
      tags={uniqueTags} tagsForListing={this.state.tagsForListing}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
      queryForExisting={this.queryForExisting}
    />;
  }
};
