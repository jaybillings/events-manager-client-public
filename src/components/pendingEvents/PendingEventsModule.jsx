import React from "react";
import {BeatLoader} from "react-spinners";
import {displayErrorMessages, printToConsole, renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

/**
 * PendingEventsModule displays pending events as a module within a layout.
 *
 * @class
 * @child
 */
export default class PendingEventsModule extends PendingListingsModule {
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
    this.eventsTagsLookupService = app.service('events-tags-lookup');
    this.pendingEventsTagsLookupService = app.service('pending-events-tags-lookup');
    this.liveEventsService = app.service('events-live');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);

    this.registerLiveListing = this.registerLiveListing.bind(this);

    this.copyPendingTagAssociations = this.copyPendingTagAssociations.bind(this);
    this.removePendingTagAssociations = this.removePendingTagAssociations.bind(this);
  }

  /**
   * `stopListening` removes data service listeners.
   * @override
   */
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

    this.pendingEventsTagsLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');
  }

  /**
   * `listenForChanges` registers data service listeners.
   * @override
   */
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

    this.pendingEventsTagsLookupService
      .on('created', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Linked tag ${message.tag_uuid} with event #${message.event_uuid}.`
        });
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Unlinked tag ${message.tag_uuid} from event #${message.event_uuid}`
        });
      });
  }

  /**
   * `queryForDuplicate` queries the live service for similar listings.
   *
   * @override
   * @async
   * @param {Object} pendingListing
   * @returns {Promise<{}>}
   */
  queryForDuplicate(pendingListing) {
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

  /**
   * `hasLiveLinked` determines whether a pending listing's linked schema have live
   * equivalents.
   *
   * @param {Object} pendingListing
   * @returns {boolean}
   */
  hasLiveLinked(pendingListing) {
    const linkedVenue = this.state.venues.find(venue => {
      return venue.uuid + '' === pendingListing.venue_uuid + '';
    }) || false;
    const linkedOrg = this.state.orgs.find(org => {
      return org.uuid + '' === pendingListing.org_uuid;
    }) || false;

    return linkedOrg.total && linkedVenue.total;
  }

  /**
   * `createSearchQuery` creates a query for searching on a term.
   *
   * For the event class, `createSearchQuery` allows searching on the name, UUID,
   * venue name, or organizer name.
   *
   * @override
   * @returns {Object|null}
   */
  createSearchQuery() {
    if (!this.state.searchTerm) return null;

    const likeClause = {$like: `%${this.state.searchTerm}%`};

    return {
      '$or': [
        {'fk_venues.name': likeClause},
        {'fk_orgs.name': likeClause},
        {'pending-events.name': likeClause},
        {'pending-events.uuid': likeClause}
      ]
    };
  }

  /**
   * `fetchAllData` fetches data for the module.
   *
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
   * `fetchVenues` fetches live venues.
   */
  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({venues: result.data, venuesLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'venues', err, this.props.updateMessagePanel, 'reload');
        this.setState({venuesLoaded: false});
      });
  }

  /**
   * `fetchPendingVenues` fetches pending venues.
   */
  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({pendingVenues: result.data, pendingVenuesLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'pending venues', err, this.props.updateMessagePanel, 'reload');
        this.setState({pendingVenuesLoaded: false});
      });
  }

  /**
   * `fetchOrgs` fetches live organizers.
   */
  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery, paginate: false})
      .then(result => {
        this.setState({orgs: result.data, orgsLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'organizers', err, this.props.updateMessagePanel, 'reload');
        this.setState({orgsLoaded: false});
      });
  }

  /**
   * `fetchPendingOrgs` fetches pending organizers.
   */
  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery, paginate: false}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'pending organizers', err, this.props.updateMessagePanel, 'reload');
        this.setState({pendingOrgs: false});
      });
  }

  /**
   * `removeListing` deletes a single listing via the REMOVE method.
   *
   * @override
   * @async
   * @param {Object} listing
   * @returns {Promise<{}>}
   */
  removeListing(listing) {
    return this.pendingListingsService.remove(listing.id)
      .then((result) => {
        this.handleListingSelect(result.id, false);
        return this.removePendingTagAssociations(listing.uuid).then(() => {
          return result;
        });
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('remove', `pending event "${listing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * `createLiveListing` creates a live listing from pending listing data.
   *
   * @override
   * @async
   * @param {Object} pendingListing
   * @returns {Promise<{}>}
   */
  createLiveListing(pendingListing) {
    let {id, ...eventData} = pendingListing;

    return this.listingsService.create(eventData)
      .then(result => {
        return Promise.all([
          this.registerLiveListing(result.id, result.name),
          this.copyPendingTagAssociations(result.uuid)
        ]);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('publish', `pending event "${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * `updateLiveListing` updates a live listing with pending listing data.
   *
   * @override
   * @async
   * @param {Object} pendingListing
   * @param {Object} target - The listing to update.
   * @returns {Promise<{}>}
   */
  updateLiveListing(pendingListing, target) {
    let {id, ...listingData} = pendingListing;

    return this.listingsService.update(target.id, listingData)
      .then(result => {
        return this.copyPendingTagAssociations(result.uuid);
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('publish', `pending ${this.schema} "${pendingListing.name}"`, err, this.props.updateMessagePanel);
      });
  }

  /**
   * `discardListings` deletes a selection of listings via the REMOVE method.
   *
   * During `discardListings`, listening is halted to avoid spamming the UX. Once
   * this function completes, the selections are cleared.
   *
   * @override
   * @async
   */
  discardListings() {
    const selectedCount = this.state.selectedListings.length;

    if (selectedCount === 0) return;

    const searchOptions = {paginate: false, query: {id: {$in: this.state.selectedListings}, $limit: selectedCount}};

    this.stopListening();

    return this.pendingListingsService.remove(null, searchOptions)
      .then(resultSet => {
        this.props.updateMessagePanel({status: 'success', details: `Deleted ${resultSet.length} events.`});
        this.fetchListings();
        return Promise
          .all(resultSet.map(listing => {
            return this.removePendingTagAssociations(listing.uuid);
          }))
          .then(results => {
            this.props.updateMessagePanel({status: 'info', details: 'Unlinked tags from deleted events.'});
            return results;
          });
      })
      .catch(err => {
        displayErrorMessages('delete', `pending ${this.schema}`, err, this.props.updateMessagePanel);
        printToConsole(err);
      })
      .finally(() => {
        this.setState({selectedListings: []});
        this.startListening();
      });
  }

  /**
   * Registers a listing as live.
   *
   * @async
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
   * `copyPendingTagAssociations` copies tag-event associations from the pending
   * to the live table.
   *
   * @async
   * @param {String} eventUUID
   * @returns {Promise<{}>}
   */
  copyPendingTagAssociations(eventUUID) {
    return this.pendingEventsTagsLookupService.find({query: {event_uuid: eventUUID}})
      .then(results => {
        if (results.total) {
          const newData = results.data.map(row => {
            return {event_uuid: row.event_uuid, tag_uuid: row.tag_uuid};
          });
          return this.eventsTagsLookupService.create(newData);
        }
        return {};
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('copy', 'event-tag links', err, this.props.updateMessagePanel);
      });
  }

  /**
   * Removes the event-tag associations of a pending listing.
   *
   * @async
   * @param {String} eventUUID
   * @returns {Promise<{}>}
   */
  removePendingTagAssociations(eventUUID) {
    return this.pendingEventsTagsLookupService
      .remove(null, {query: {event_uuid: eventUUID}})
      .catch(err => {
        displayErrorMessages('remove', 'event-tag connections', err, this.props.updateMessagePanel, 'retry');
        printToConsole(err);
      });
  }

  /**
   * Renders the module's data table.
   *
   * @override
   * @returns {[*]}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.pendingVenuesLoaded &&
      this.state.orgsLoaded && this.state.pendingOrgsLoaded)) {
      return <div className={'single-message info message-compact'}>Data is loading... Please be patient...</div>;
    }
    if (this.state.pendingListingsTotal === 0) return <div>No pending events to list.</div>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venues.name', 'Venue'],
      ['fk_orgs.name', 'Organizer'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const uniqueVenues = uniqueListingsOnly(this.state.venues, this.state.pendingVenues);
    const uniqueOrgs = uniqueListingsOnly(this.state.orgs, this.state.pendingOrgs);
    const selectedEvents = this.state.selectedListings;
    const schemaLabel = selectedEvents.length === 1 ? 'event' : 'events';
    const spinnerClass = this.state.publishRunning ? ' button-with-spinner' : '';

    const publishButton = this.user.is_su ?
      <button type={'button'} className={`button-primary${spinnerClass}`} onClick={this.handlePublishButtonClick}
              disabled={selectedEvents.length === 0}>
        <BeatLoader size={8} color={'#c2edfa'} loading={this.state.publishRunning} />
        Publish {selectedEvents.length || ''} {schemaLabel}
      </button> : '';

    return [
      <ShowHideToggle
        key={'events-module-showhide'} isVisible={this.state.moduleVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'events-module-body'}>
        <SelectionControl
          numSelected={selectedEvents.length} total={this.state.pendingListingsTotal} schema={this.schema}
          selectPage={this.selectPageOfListings} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-events-pagination'} schema={'pending-events'} includeAll={false}
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
                handleListingSelect={this.handleListingSelect} queryForDuplicate={this.queryForDuplicate}
                queryForMatching={this.queryForMatching}
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
    ]
  }
}
