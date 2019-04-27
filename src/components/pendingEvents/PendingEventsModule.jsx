import React from "react";
import {displayErrorMessages, renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";
import Searchbar from "../common/Searchbar";

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

    this.state = {
      ...this.state, orgs: [], venues: [], pendingOrgs: [], pendingVenues: [],
      orgsLoaded: false, venuesLoaded: false, pendingOrgsLoaded: false,
      pendingVenuesLoaded: false
    };

    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.orgsService = app.service('organizers');
    this.pendingOrgsService = app.service('pending-organizers');
    this.tagsLookupService = app.service('events-tags-lookup');
    this.liveEventsService = app.service('events-live');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);
  }

  stopListening() {
    super.stopListening();

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

  listenForChanges() {
    super.listenForChanges();

    const services = new Map([
      [this.orgsService, this.fetchOrgs],
      [this.pendingOrgsService, this.fetchPendingOrgs],
      [this.venuesService, this.fetchVenues],
      [this.pendingVenuesService, this.fetchPendingVenues]
    ]);

    for (let [service, dataFetcher] of services) {
      service
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher());
    }
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
   * Fetches published venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'venues', err, this.props.updateMessagePanel, 'reload');
        this.setState({venuesLoaded: false});
      });
  }

  /**
   * Fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({pendingVenues: result.data, pendingVenuesLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'pending venues', err, this.props.updateMessagePanel, 'reload');
        this.setState({pendingVenuesLoaded: false});
      });
  }

  /**
   * Fetches published organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({orgs: result.data, orgsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'organizers', err, this.props.updateMessagePanel, 'reload');
        this.setState({orgsLoaded: false});
      });
  }

  /**
   * Fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery, paginate: false}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    })
      .catch(err => {
        displayErrorMessages('fetch', 'pending organizers', err, this.props.updateMessagePanel, 'reload');
        this.setState({pendingOrgs: false});
      });
  }

  /**
   * Determines whether a given listing may duplicate an existing listing.
   * @async
   * @override
   *
   * @param {object} pendingListing
   * @returns {Promise<*>}
   */
  queryForExisting(pendingListing) {
    return this.listingsService.find({
      query: {
        $or: [
          {uuid: pendingListing.uuid},
          {
            name: pendingListing.name,
            start_date: pendingListing.start_date,
            end_date: pendingListing.end_date
          }
        ],
        $select: ['uuid']
      }
    });
  }

  checkForLiveLinked(pendingListing) {
    const linkedVenue = this.state.venues.find(venue => {
      return venue.uuid === pendingListing.venue_uuid;
    });
    const linkedOrg = this.state.orgs.find(org => {
      return org.uuid === pendingListing.org_uuid;
    });

    return linkedOrg && linkedVenue;
  }

  /**
   * Removes a given pending listing from the database.
   * @override
   * @param {Object} listing
   */
  removeListing(listing) {
    return this.pendingListingsService.remove(listing.id)
      .then((result) => {
        return this.removeTagAssociations(listing.uuid).then(() => {
          return result;
        });
      })
      .catch(err => {
        displayErrorMessages('remove', `pending event "${listing.name}"`, err, this.props.updateMessagePanel);
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
    if (!this.checkForLiveLinked(pendingListing)) {
      return Promise.reject('Missing required linked schema.');
    }

    let {id, ...eventData} = pendingListing;

    return this.listingsService.create(eventData)
      .then(result => {
        return this.registerLiveListing(result.id, result.name);
      })
      .catch(err => {
        displayErrorMessages('publish', `pending event "${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * Removes all selected pending listings from the database. Used in row quick-edits.
   * @override
   */
  discardListings() {
    const selectedCount = this.state.selectedListings.length;

    if (selectedCount === 0) return;

    const searchOptions = {paginate: false, query: {id: {$in: this.state.selectedListings}, $limit: selectedCount}};

    return this.pendingListingsService.remove(null, searchOptions)
      .then(resultSet => {
        return Promise.all(resultSet.data.map(listing => {
          return this.removeTagAssociations(listing.uuid);
        }));
      })
      .catch(err => {
        displayErrorMessages('delete', `pending ${this.schema}`, err, this.props.updateMessagePanel);
        console.log(`~ error in discardListings`, err);
      });
  }

  /**
   * Registers a listing as live.
   *
   * @param {int} eventID
   * @param {string} eventName
   */
  registerLiveListing(eventID, eventName) {
    return this.liveEventsService.create({event_id: eventID})
      .catch(err => {
        displayErrorMessages('register as live', `"${eventName}"`, err, this.props.updateMessagePanel);
        console.log(`~ error in registerLiveListing`, err);
      });
  }

  /**
   * Removes the tag associations of a given pending listing, if no matching live listing is present.
   *
   * @param {string} eventUUID
   */
  removeTagAssociations(eventUUID) {
    // Check for matching live event
    return this.listingsService.find({query: {uuid: eventUUID}})
      .then(results => {
        if (!results.total) {
          // Safe to delete tag associations
          return this.tagsLookupService.remove(null, {query: {event_uuid: eventUUID}});
        } else {
          // Not used, but might be useful in future
          return {matchingEventCount: results.total};
        }
      })
      .catch(err => {
        console.log(`~ error in removeTagAssociations`, err);
      });
  }

  /**
   * Renders the table of listings.
   * @override
   *
   * @returns {[*]}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.pendingVenuesLoaded &&
      this.state.orgsLoaded && this.state.pendingOrgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    if (this.state.pendingListingsTotal === 0) return <p>No pending events to list.</p>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venue', 'Venue'],
      ['fk_org', 'Organizer'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const uniqueVenues = uniqueListingsOnly(this.state.venues, this.state.pendingVenues);
    const uniqueOrgs = uniqueListingsOnly(this.state.orgs, this.state.pendingOrgs);
    const selectedEvents = this.state.selectedListings;
    const schemaLabel = selectedEvents.length === 1 ? 'event' : 'events';
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary'} onClick={this.handlePublishButtonClick}
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
          numSelected={selectedEvents.length} total={this.state.pendingListingsTotal} schema={this.schema}
          selectPage={this.selectPageOfListings} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <Searchbar />
        <PaginationLayout
          key={'pending-events-pagination'} schema={'pending-events'}
          total={this.state.pendingListingsTotal} pageSize={this.state.pageSize} activePage={this.state.currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-events-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColSort)}</thead>
          <tbody>
          {
            this.state.pendingListings.map(event =>
              <PendingEventRow
                key={`event-${event.id}`} schema={'pending-events'} listing={event}
                selected={selectedEvents.includes(event.id)} venues={uniqueVenues} orgs={uniqueOrgs}
                venue={uniqueVenues.find(v => {
                  return ('' + v.uuid) === ('' + event.venue_uuid);
                })}
                org={uniqueOrgs.find(o => {
                  return ('' + o.uuid) === ('' + event.org_uuid);
                })}
                updateListing={this.updateListing} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <div className={'publish-buttons'}>
          {publishButton}
          <button type={'button'} className={'publish'} onClick={this.discardListings}
                  disabled={selectedEvents.length === 0}>
            Discard {selectedEvents.length || ''} {schemaLabel}
          </button>
        </div>
      </div>
    ])
  }
}
