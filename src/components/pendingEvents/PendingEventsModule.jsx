import React from "react";
import {displayErrorMessages, renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

/**
 * PendingEventsModule is a component which displays pending events as a module within a layout.
 * @class
 * @child
 */
export default class PendingEventsModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{defaultPageSize: int, defaultSortOrder: Object, updateMessagePanel: Function}} props
   */
  constructor(props) {
    super(props, 'events');

    Object.assign(this.state, {
      orgs: [], venues: [], pendingOrgs: [], pendingVenues: [],
      orgsLoaded: false, venuesLoaded: false, pendingOrgsLoaded: false, pendingVenuesLoaded: false
    });

    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.orgsService = app.service('organizers');
    this.pendingOrgsService = app.service('pending-organizers');
    this.tagsService = app.service('tags');
    this.pendingTagsLookupService = app.service('pending-events-tags-lookup');
    this.tagsLookupService = app.service('events-tags-lookup');
    this.liveEventsService = app.service('events-live');

    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);

    this.copyTagAssociations = this.copyTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
  }

  /**
   * Runs once the component is mounted. Fetches all data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    const services = new Map([
      [this.orgsService, this.fetchOrgs],
      [this.pendingOrgsService, this.fetchPendingOrgs],
      [this.venuesService, this.fetchVenues],
      [this.pendingVenuesService, this.fetchPendingVenues]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher)
        .on('updated', () => dataFetcher)
        .on('patched', () => dataFetcher)
        .on('removed', () => dataFetcher);
    }
  }

  /**
   * Runs before the component unmounts. Removes data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    const services = [
      this.orgsService,
      this.pendingOrgsService,
      this.venuesService,
      this.pendingVenuesService
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
   * Fetches all data for the page.
   * @override
   */
  fetchAllData() {
    this.fetchListings();
    this.fetchOrgs();
    this.fetchPendingOrgs();
    this.fetchVenues();
    this.fetchPendingVenues();
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    });
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    });
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
   * Determines whether a given listing may duplicate an existing listing.
   * @async
   * @override
   * @param {object} pendingListing
   * @returns {Promise<*>}
   */
  queryForExisting(pendingListing) {
    return this.listingsService.find({
      query: {
        $or: [{uuid: pendingListing.uuid}, {description: pendingListing.description}, {
          name: pendingListing.name,
          start_date: pendingListing.start_date,
          end_date: pendingListing.end_date
        }],
        $select: ['uuid']
      }
    });
  }

  /**
   * Removes a given pending listing from the database.
   * @override
   * @param {int} id
   */
  removeListing(id) {
    this.pendingListingsService.remove(id).then(() => {
      this.removeTagAssociations(id);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Creates a new live event from the data of a pending event.
   * @override
   * @note Used when publishing listings.
   *
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    let {id, venue_uuid, org_uuid, ...eventData} = pendingListing;
    const eventVenue = this.state.venues.find(venue => {
      return venue.uuid === venue_uuid
    });
    const eventOrg = this.state.orgs.find(org => {
      return org.uuid === org_uuid
    });

    eventData.venue_id = eventVenue.id || null;
    eventData.org_id = eventOrg.id || null;

    this.listingsService.create(eventData).then(result => {
      // This isn't a listener because I only want to send a message for this specific create event.
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published "${result.name}" as new event #${result.id}`
      });
      this.copyTagAssociations(id, result.id);
      this.registerLiveListing(result.id, result.name);
      this.removeListing(id);
    }, err => {
      displayErrorMessages('publish', `"${pendingListing.name}"`, err, this.props.updateMessagePanel);
    });
  }

  /**
   * Updates the matching live event with the pending event's data. Used when publishing listings.
   * @override
   *
   * @param {object} pendingListing
   * @param {object} target
   */
  replaceLiveListing(pendingListing, target) {
    let {id, venue_uuid, org_uuid, ...eventData} = pendingListing;
    const eventVenue = this.state.venues.find(venue => {
      return venue.uuid === venue_uuid
    });
    const eventOrg = this.state.orgs.find(org => {
      return org.uuid === org_uuid
    });

    eventData.venue_id = eventVenue.id || null;
    eventData.org_id = eventOrg.id || null;

    this.listingsService.update(target.id, eventData).then(result => {
      // This isn't a listener because I only want to send a message for this specific create event.
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published ${result.name} as an update to ${target.name}`
      });
      this.copyTagAssociations(id, target.id);
      this.removeListing(id);
    }, err => {
      displayErrorMessages('publish', `"${pendingListing.name}"`, err, this.props.updateMessagePanel);
    });
  }

  /**
   * Removes all selected pending listings from the database. Used in row quick-edits.
   * @override
   */
  discardListings() {
    const query = this.state.selectedListings.length === 0 ? {} : {id: {$in: this.state.selectedListings}};
    let searchOptions = {paginate: false};

    if (query) searchOptions.query = query;

    this.pendingListingsService.remove(null, searchOptions).then(message => {
      message.forEach(listing => {
        this.removeTagAssociations(listing.id);
      });
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Copies pending tag associations to the matching live listing. Used when publishing.
   *
   * @param {int} pendingID
   * @param {int} liveID
   */
  copyTagAssociations(pendingID, liveID) {
    // Find all tag UUIDs associated with the pending event
    this.pendingTagsLookupService.find({query: {pending_event_id: pendingID}})
      .then(results => {
        // Find the live tag IDs that match the UUIDs
        const tagUUIDs = [];

        /** @var {string} pendingTagLookupRow.tag_uuid */
        results.data.forEach(pendingTagLookupRow => {
          tagUUIDs.push(pendingTagLookupRow.tag_uuid)
        });

        this.tagsService.find(null, {query: {uuid: {$in: tagUUIDs}}});
      })
      .then(results => {
        // Create the lookup rows
        const tagAssociations = [];

        results.data.forEach(tagRow => {
          tagAssociations.push({event_id: liveID, tag_id: tagRow.id});
        });

        if (tagAssociations) this.tagsLookupService.create(tagAssociations);
      })
      .then(() => {
        this.props.updateMessagePanel({status: 'info', details: `Associated tags with event #${liveID}`});
      })
      .catch(err => {
        const details = `Could not associate tags with event #${liveID}. Error is: ${JSON.stringify(err)}`;
        this.props.updateMessagePanel({status: 'error', details: details});
      });
  }

  /**
   * Removes pending tag associations.
   *
   * @param {int} pendingID
   */
  removeTagAssociations(pendingID) {
    this.pendingTagsLookupService.remove(null, {query: {pending_event_id: pendingID}}).then(() => {
      this.props.updateMessagePanel({status: 'info', details: 'Pending tag associations for event removed'})
    }, err => {
      this.props.updateMessagePanel({
        status: 'error',
        details: `Could not remove tag associations for event. Error is: ${JSON.stringify(err)}`
      });
    });
  }

  /**
   * Registers a listing as live.
   *
   * @param {int} eventID
   * @param {string} eventName
   */
  registerLiveListing(eventID, eventName) {
    this.liveEventsService.create({event_id: eventID}).then(() => {
      this.props.updateMessagePanel({status: 'info', details: `${eventName} registered as live`});
    }, err => {
      this.props.updateMessagePanel({
        status: 'error',
        message: `${eventName} could not be registered as live. Go to the listing's page to resolve manually. Error is: ${err.message}`
      })
    });
  }

  /**
   * Renders the table of listings.
   * @override
   *
   * @returns {[*]}
   */
  renderTable() {
    const pendingEventsTotal = this.state.pendingListingsTotal;

    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.pendingVenuesLoaded &&
      this.state.orgsLoaded && this.state.pendingOrgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingEventsTotal === 0) {
      return <p>No pending events to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['venue_id', 'Venue'],
      ['org_id', 'Organizer'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const uniqueVenues = uniqueListingsOnly(this.state.venues, this.state.pendingVenues);
    const uniqueOrgs = uniqueListingsOnly(this.state.orgs, this.state.pendingOrgs);
    const selectedEvents = this.state.selectedListings;
    const schemaLabel = selectedEvents.length === 1 ? 'event' : 'events';
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary'} onClick={this.publishListings}
              disabled={selectedEvents.length === 0}>
        Publish {selectedEvents.length || ''} {schemaLabel}
      </button> : '';

    return ([
      <ShowHideToggle
        key={'events-module-showhide'} isVisible={this.state.moduleVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'events-module-body'}>
        <SelectionControl
          numSelected={selectedEvents.length} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-events-pagination'} schema={'pending-events'}
          total={pendingEventsTotal} pageSize={this.state.pageSize} activePage={this.state.currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-events-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            this.state.pendingListings.map(event =>
              <PendingEventRow
                key={`event-${event.id}`} selected={selectedEvents.includes(event.id)} schema={'pending-events'}
                listing={event} venues={uniqueVenues} orgs={uniqueOrgs}
                venue={uniqueVenues.find(v => {
                  // This may be a numeric ID or a UUID
                  // noinspection EqualityComparisonWithCoercionJS
                  return v.uuid == event.venue_uuid
                })}
                org={uniqueOrgs.find(o => {
                  // This may be a numeric ID or a UUID
                  // noinspection EqualityComparisonWithCoercionJS
                  return o.uuid == event.org_uuid
                })}
                updateListing={this.updateListing} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        {publishButton}
        <button type={'button'} onClick={this.discardListings} disabled={selectedEvents.length === 0}>
          Discard {selectedEvents.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }
}
