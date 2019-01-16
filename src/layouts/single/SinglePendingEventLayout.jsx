import React from 'react';
import {Redirect} from 'react-router';
import {Link} from "react-router-dom";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import PendingEventRecord from "../../components/pendingEvents/PendingEventRecord";
import MessagePanel from "../../components/common/MessagePanel";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";
import {uniqueListingsOnly} from "../../utilities";

/**
 * SinglePendingEventLayout is a component which lays out a single pending event page.
 *
 * @class
 * @child
 */
export default class SinglePendingEventLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   *
   * @param {object} props
   */
  constructor(props) {
    super(props, 'pending-events');

    this.state = {
      hasDeleted: false, notFound: false, messages: [], messagePanelVisible: false,
      listing: {}, orgs: [], venues: [], tags: [],
      pendingOrgs: [], pendingVenues: [], pendingTags: [], tagsForListing: [],
      listingLoaded: false, orgsLoaded: false, venuesLoaded: false, tagsLoaded: false,
      pendingOrgsLoaded: false, pendingVenuesLoaded: false, pendingTagsLoaded: false, tagAssociationsLoaded: false
    };

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

    this.checkWriteStatus = this.checkWriteStatus.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
  }

  /**
   * Runs once the component mounts. Registers data service listeners and fetches data.
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.orgsService, this.fetchOrgs],
      [this.pendingOrgsService, this.fetchPendingOrgs],
      [this.venuesService, this.fetchVenues],
      [this.pendingVenuesService, this.fetchPendingVenues],
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
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    const services = [
      this.orgsService,
      this.pendingOrgsService,
      this.venuesService,
      this.pendingVenuesService,
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
  }

  /**
   * Fetches all data required for the page.
   */
  fetchAllData() {
    this.fetchListing();
    this.fetchOrgs();
    this.fetchPendingOrgs();
    this.fetchVenues();
    this.fetchPendingVenues();
    this.fetchTags();
    this.fetchPendingTags();
    this.fetchTagAssociations();
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    })
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    })
  }

  /**
   * Fetches published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });
  }

  /**
   * Fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingVenues: message.data, pendingVenuesLoaded: true});
    });
  }

  /**
   * Fetches published tags.
   */
  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    });
  }

  /**
   * Fetches pending tags.
   */
  fetchPendingTags() {
    this.pendingTagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingTags: message.data, pendingTagsLoaded: true})
    })
  }

  /**
   * Fetches associations between all tags (published or pending) and pending events.
   */
  fetchTagAssociations() {
    this.pendingEventsTagsLookupService.find({query: {pending_event_id: this.props.match.params.id}}).then(message => {
      this.setState({tagsForListing: message.data.map(row => row.tag_uuid), tagAssociationsLoaded: true});
    });
  }

  /**
   * Updates the event's data by calling the service's PATCH method.
   *
   * @override
   * @param {object} listingData
   */
  updateListing(listingData) {
    this.listingsService.patch(this.state.listing.id, listingData.eventData).then(() => {
      this.checkWriteStatus();
      if (listingData.tagsToSave) this.createTagAssociations(listingData.tagsToSave);
      if (listingData.tagsToRemove) this.removeTagAssociations(listingData.tagsToRemove);
    }, err => {
      this.updateMessagePanel({status: 'error', details: `Error code ${err.code} - ${err.message}`});
    });
  }

  /**
   * Removes the pending event from the database by calling the service's REMOVE method.
   */
  deleteListing() {
    this.listingsService.remove(this.state.listing.id).then(() => {
      this.removeTagAssociations();
      this.setState({hasDeleted: true});
    }, err => {
      console.log('remove pending event error', JSON.stringify(err));
    });
  }

  /**
   * Creates associations between tags and pending event.
   *
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
   *
   * @param {object[]} tagsToRemove
   * @returns {Promise}
   */
  removeTagAssociations(tagsToRemove) {
    return this.pendingEventsTagsLookupService.remove(null, {query: {pending_event_id: {$in: tagsToRemove}}}).catch(err => {
      const details = 'Could not de-associate tags from event. Please re-save listing. '
        + `Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  /**
   * Renders the single pending event's record.
   *
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
      updateListing={this.updateListing} deleteListing={this.deleteListing} queryForExisting={this.queryForExisting}
    />;
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/import'} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const pendingEventName = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={'/import'}>&lt; Return to import</Link></p>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{pendingEventName}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
};
