import React from "react";
import {renderTableHeader, uniqueListingsOnly} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

export default class PendingEventsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'events');

    Object.assign(this.state, {
      orgs: [], orgsLoaded: false, pendingOrgs: [], pendingOrgsLoaded: false,
      venues: [], venuesLoaded: false, pendingVenues: [], pendingVenuesLoaded: false
    });

    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');
    this.orgsService = app.service('organizers');
    this.pendingOrgsService = app.service('pending-organizers');

    this.pendingTagsLookupService = app.service('pending-events-tags-lookup');
    this.tagsLookupService = app.service('events-tags-lookup');

    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchPendingOrgs = this.fetchPendingOrgs.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchPendingVenues = this.fetchPendingVenues.bind(this);

    this.removePendingTagAssociations = this.removePendingTagAssociations.bind(this);
    this.copyTagAssociations = this.copyTagAssociations.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Added "${message.name}" as new pending event.`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchPendingListings());
      })
      .on('updated', message => {
        this.props.updateMessageList({status: 'info', details: message.details});
        this.fetchPendingListings();
      })
      .on('patched', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Updated pending event "${message.name}"`
        });
        this.fetchPendingListings();
      })
      .on('removed', message => {
        this.props.updateMessageList({
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
        .on('created', () => dataFetcher())
        .on('updated', () => dataFetcher())
        .on('patched', () => dataFetcher())
        .on('removed', () => dataFetcher());
    }
  }

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

  fetchAllData() {
    this.fetchPendingListings();
    this.fetchOrgs();
    this.fetchPendingOrgs();
    this.fetchVenues();
    this.fetchPendingVenues();
  }

  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true});
    });
  }

  fetchPendingOrgs() {
    this.pendingOrgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingOrgs: message.data, pendingOrgsLoaded: true});
    });
  }

  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });
  }

  fetchPendingVenues() {
    this.pendingVenuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({pendingVenues: message.data, pendingVenuesLoaded: true});
    });
  }

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
   * Creates a new live event. Used when publishing events.
   *
   * @override
   * @param {object} pendingListing
   */
  createLiveListing(pendingListing) {
    // On create, copy tags lookup to live table
    const id = pendingListing.id;
    delete (pendingListing.id);

    this.listingsService.create(pendingListing).then(result => {
      console.log('creating event', result);
      this.props.updateMessageList({
        status: 'success',
        details: `Published ${result.name} as new event #${result.id}`
      });
      this.copyTagAssociations(id, result.id);
      this.removeListing(id);
    }, err => {
      console.log('error creating event', JSON.stringify(err));
      this.props.updateMessageList({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the matching live event with the pending event's data. Used when publishing listings.
   * @param {object} pendingListing
   * @param {object} target
   */
  updateLiveListing(pendingListing, target) {
    const id = pendingListing.id;
    delete (pendingListing.id);

    this.listingsService.update(target.id, pendingListing).then(result => {
      console.log('updating event', result);
      this.props.updateMessageList({
        status: 'success',
        details: `Published ${result.name} as an update to ${target.name}`
      });
      this.copyTagAssociations(id, pendingListing.id);
      this.removeListing(id);
    }, err => {
      console.log('error updating event', err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  discardListings() {
    const query = this.state.selectedListings.length === 0 ? {} : {id: {$in: this.state.selectedListings}};
    let searchOptions = {paginate: false};

    if (query) searchOptions.query = query;

    this.pendingListingsService.remove(null, searchOptions).then(results => {
      console.log(results);
      results.forEach(listing => {
        this.removePendingTagAssociations(listing.id);
      });
    }, err => {
      this.props.updateMessageList({status: 'error', details: err});
      console.log('error publishing events', JSON.stringify(err));
    });
  }

  removeListing(id) {
    // TODO: Remove tags as well
    this.pendingListingsService.remove(id).then(() => {
      this.removePendingTagAssociations(id);
    }, err => {
      console.log(`error removing pending event`, JSON.stringify(err));
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  copyTagAssociations(pendingId, liveID) {
    console.log('in copyTagAssociations');
    this.pendingTagsLookupService.find({query: {pending_event_id: pendingId}}).then(resultSet => {
      const tagAssociations = [];

      resultSet.data.forEach(lookupRow => {
        tagAssociations.push({event_id: liveID, tag_uuid: lookupRow.tag_uuid});
      });

      this.tagsLookupService.create(tagAssociations).then(() => {
        this.props.updateMessageList({
          status: 'info',
          details: `Associated tags with ${this.schema.slice(0, -1)} #${liveID}`
        });
      }, err => {
        const details = `Could not associate tags with ${this.schema.slice(0, -1)} #${liveID}. Please re-save listing by going to its listing page.`;
        this.props.updateMessageList({status: 'error', details: details});
        console.log('error creating tag lookups', err);
      });
    }, err => console.log('error looking up pending tag associations', err));
  }

  removePendingTagAssociations(pendingID) {
    console.log('in removeTagAssociations');
    this.pendingTagsLookupService.remove(null, {query: {pending_event_id: pendingID}})
      .then(result => console.log('pending tag lookups removed', result),
        err => console.log('error removing pending tag associations', err));
  }

  renderTable() {
    const pendingEventsCount = this.state.pendingListingsCount;

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
    const numSchemaLabel = selectedEvents.length || "All";
    const schemaLabel = selectedEvents.length === 1 ? 'event' : 'events';


    return ([
      <ShowHideToggle key={'events-module-showhide'} isVisible={isVisible}
                      changeVisibility={this.toggleModuleVisibility} />,
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
                venue={uniqueVenues.find(v => {return v.uuid === event.venue_uuid})} venues={uniqueVenues}
                org={uniqueOrgs.find(o => {return o.uuid === event.org_uuid})} orgs={uniqueOrgs}
                saveChanges={this.saveChanges} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} onClick={this.publishListings}>Publish {numSchemaLabel} {schemaLabel}</button>
        <button type={'button'} onClick={this.discardListings}>Discard {numSchemaLabel} {schemaLabel}</button>
      </div>
    ])
  }

  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>Events</h3>
        {this.renderTable()}
      </div>
    );
  }
}
