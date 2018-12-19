import React from "react";
import {renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

/**
 * The PendingEventsModule component displays pending events as a module within another page.
 * @class
 */
export default class PendingEventsModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
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
    this.removePendingTagAssociations = this.removePendingTagAssociations.bind(this);
    this.copyTagAssociations = this.copyTagAssociations.bind(this);
  }

  /**
   * Runs once the component is mounted. Fetches all data and registers listeners.
   */
  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Added "${message.name}" as new pending event.`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      })
      .on('updated', message => {
        this.props.updateMessagePanel({status: 'info', details: message.details});
        this.fetchPendingListings();
      })
      .on('patched', message => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Updated pending event "${message.name}"`
        });
        this.fetchPendingListings();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({
          status: 'info',
          details: `Discarded pending event "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      });

    const services = new Map([
      [this.orgsService, this.fetchOrgs],
      [this.pendingOrgsService, this.fetchPendingOrgs],
      [this.venuesService, this.fetchVenues],
      [this.pendingVenuesService, this.fetchPendingVenues]
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
   * Runs before the component unmounts. Removes listeners.
   */
  componentWillUnmount() {
    const services = [
      this.pendingListingsService,
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
   */
  fetchAllData() {
    this.fetchPendingListings();
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
   *
   * @async
   * @override
   * @param {object} pendingListing
   * @returns {Promise}
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
   * Creates a new live event from the data of a pending event. Used when publishing listings.
   *
   * @override
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    const id = pendingListing.id;
    delete (pendingListing.id);

    this.listingsService.create(pendingListing).then(result => {
      // This isn't a listener because I only want to send a message for this specific create event.
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published "${result.name}" as event #${result.id}`
      });
      this.copyTagAssociations(id, result.id);
      this.registerLiveListing(result.id, result.name);
      this.removePendingListing(id);
    }, err => {
      console.log('error creating event', JSON.stringify(err));
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the matching live event with the pending event's data. Used when publishing listings.
   *
   * @override
   * @param {object} pendingListing
   * @param {object} target
   */
  updateLiveListing(pendingListing, target) {
    const id = pendingListing.id;
    delete (pendingListing.id);

    this.listingsService.update(target.id, pendingListing).then(result => {
      // This isn't a listener because I only want to send a message for this specific create event.
      this.props.updateMessagePanel({
        status: 'success',
        details: `Published ${result.name} as an update to ${target.name}`
      });
      this.copyTagAssociations(id, pendingListing.id);
      this.removePendingListing(id);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Removes a given pending listing from the database.
   *
   * @override
   * @param {int} id
   */
  removePendingListing(id) {
    this.pendingListingsService.remove(id).then(() => {
      this.removePendingTagAssociations(id);
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Removes all selected pending listings from the database.
   *
   * @override
   */
  discardListings() {
    const query = this.state.selectedListings.length === 0 ? {} : {id: {$in: this.state.selectedListings}};
    let searchOptions = {paginate: false};

    if (query) searchOptions.query = query;

    this.pendingListingsService.remove(null, searchOptions).then(results => {
      results.forEach(listing => {
        this.removePendingTagAssociations(listing.id);
      });
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Copies pending tag associations to the matching live listing. Used when publishing.
   *
   * @param {int} pendingId
   * @param {int} liveID
   */
  copyTagAssociations(pendingId, liveID) {
    // Find all tag UUIDs associated with the pending event
    this.pendingTagsLookupService.find({query: {pending_event_id: pendingId}})
      .then(results => {
        // Find the live tag IDs that match the UUIDs
        const tagUUIDs = [];

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

        this.tagsLookupService.create(tagAssociations);
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
  removePendingTagAssociations(pendingID) {
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
      this.props.updateMessagePanel({status: 'info', message: `${eventName} registered as live`});
    }, err => {
      console.log('error in events-live create', JSON.stringify(err));
      this.props.updateMessagePanel({
        status: 'error',
        message: `${eventName} could not be registered as live. Go to the listing's page to resolve manually.`
      })
    });
  }

  /**
   * Renders the table of listings.
   *
   * @override
   * @returns {*}
   */
  renderTable() {
    const pendingEventsCount = this.state.pendingListingsTotal;

    if (!(this.state.listingsLoaded && this.state.venuesLoaded && this.state.pendingVenuesLoaded &&
      this.state.orgsLoaded && this.state.pendingOrgsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingEventsCount === 0) {
      return <p>No pending events to list.</p>
    }

    const pendingEvents = this.state.pendingListings;
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
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const selectedEvents = this.state.selectedListings;
    const schemaLabel = selectedEvents.length === 1 ? 'event' : 'events';

    return ([
      <ShowHideToggle
        key={'events-module-showhide'} isVisible={isVisible} changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'events-module-body'}>
        <SelectionControl
          numSelected={selectedEvents.length} selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-events-pagination'} schema={'pending-events'}
          total={pendingEventsCount} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-events-table'}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingEvents.map(event =>
              <PendingEventRow
                key={`event-${event.id}`} pendingListing={event} selected={selectedEvents.includes(event.id)}
                venue={uniqueVenues.find(v => {
                  return v.uuid === event.venue_uuid
                })} venues={uniqueVenues}
                org={uniqueOrgs.find(o => {
                  return o.uuid === event.org_uuid
                })} orgs={uniqueOrgs}
                saveChanges={this.saveChanges} removeListing={this.removePendingListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} className={'button-primary'} onClick={this.publishListings}
                disabled={selectedEvents.length === 0}>
          Publish {selectedEvents.length || ''} {schemaLabel}
        </button>
        <button type={'button'} onClick={this.discardListings} disabled={selectedEvents.length === 0}>
          Discard {selectedEvents.length || ''} {schemaLabel}
        </button>
      </div>
    ])
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>Events</h3>
        {this.renderTable()}
      </div>
    )
  }
}
