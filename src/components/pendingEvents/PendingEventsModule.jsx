import React from "react";
import {renderTableHeader} from "../../utilities";
import app from '../../services/socketio';

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingEventRow from "./PendingEventRow";
import ShowHideToggle from "../common/ShowHideToggle";

export default class PendingEventsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'events');

    this.pendingTagLookupService = app.service('pending-events-tags-lookup');
    this.tagLookupService = app.service('events-tags-lookup');

    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.addTagAssociations = this.addTagAssociations.bind(this);
  }

  createLiveListing(listing) {
    // On create, copy tags lookup to live table
    const id = listing.id;

    delete(listing.id);
    delete(listing.target_id);

    this.listingsService.create(listing).then(result => {
      console.log('creating event', result);
      this.props.updateMessageList({
        status: 'success',
        details: `Published live event ${result.name} with ID #${result.id}`
      });
      this.addTagAssociations(id, result.id).then(this.discardListing(id));
    }, err => {
      console.log('error creating event', err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  updateLiveListing(listing) {
    const id = listing.id;
    const target_id = listing.target_id;

    delete(listing.id);
    delete(listing.target_id);

    this.listingsService.update(target_id, listing).then(msg => {
      console.log('updating event', msg);
      this.props.updateMessageList({
        status: 'success',
        details: `Updated live event #${listing.id} - ${listing.name}`
      });
      this.removeTagAssociations(id, listing.id).then(this.addTagAssociations(id, listing.id).then(this.discardListing(id)));
    }, err => {
      console.log('error updating event', err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  discardListing(id) {
    // TODO: Remove tags as well
    this.pendingListingsService.remove(id).then(message => {
      console.log('removing pending event', message);
      this.removeTagAssociations(id);
    }, err => {
      console.log(`error removing pending event`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  addTagAssociations(pendingID, liveID) {
    this.pendingTagLookupService.find({query: {pending_event_id: pendingID}}).then(resultSet => {
      const tagAssociations = [];

      resultSet.data.forEach(lookupRow => {
        tagAssociations.push({event_id: liveID, tag_id: lookupRow.tag_id});
      });

      this.tagLookupService.create(tagAssociations)
        .then(msg => console.log('tag lookups created', msg), err => console.log('error creating tag lookups', err));
    }, err => console.log('error looking up pending tag associations', err));
  }

  removeTagAssociations(id) {
    this.pendingTagLookupService.remove(null, {query: {pending_event_id: id}})
      .then(result => console.log('pending tag lookups removed', result),
        err => console.log('error removing pending tag associations', err));
  }

  renderTable() {
    const pendingEvents = this.state.pendingListings;
    const pendingEventsCount = this.state.pendingListingsCount;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const tags = this.props.tags;

    if (!(pendingEvents && venues && orgs && tags)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingEventsCount === 0) {
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
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;

    return (
      <div>
        <ShowHideToggle isVisible={isVisible} changeVisibility={this.toggleModuleVisibility} />
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
                key={`event-${event.id}`} pendingListing={event}
                venue={venues.find(v => {
                  return v.id === event.venue_id
                })}
                org={orgs.find(o => {
                  return o.id === event.org_id
                })}
                venues={venues} orgs={orgs}
                saveChanges={this.saveChanges} discardListing={this.discardListing}
                listingIsDup={this.queryForSimilar}
              />)
          }
          </tbody>
        </table>
        <p>0 / {pendingEventsCount} events selected</p>
        <button type={'button'} onClick={this.publishListings}>Publish All Pending Events</button>
      </div>
    )
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
