import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingEventRow from './PendingEventRow';

import '../../styles/schema-table.css';

export default class PendingEventsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingEvents: [], pendingEventsCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.pendingEventsService = app.service('pending-events');
    this.eventsService = app.service('events');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);
    this.queryForSimilar = this.queryForSimilar.bind(this);

    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingEventsService
      .on('created', message => {
        this.props.updateMessageList({status: 'success', details: `Added ${message.name} with ID #${message.id}`});
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessageList(message);
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({status: 'success', details: `Updated #${message.id} - ${message.name}`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList({status: 'success', details: `Discarded pending event #${message.id} - ${message.name}`});
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingEventsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingEventsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find pending-events', message);
      this.setState({pendingEvents: message.data, pendingEventsCount: message.total});
    });
  }

  discardListing(id) {
    this.pendingEventsService.remove(id).then(message => console.log('removed', message));
  }

  saveChanges(id, newData) {
    this.pendingEventsService.patch(id, newData).then(message => console.log('patched', message));
  }

  async queryForSimilar(pendingEvent) {
    return this.eventsService.find({
      query: {
        name: pendingEvent.name,
        start_date: pendingEvent.start_date,
        end_date: pendingEvent.end_date
      }
    });
  }

  render() {
    const pendingEvents = this.state.pendingEvents;
    const pendingEventsCount = this.state.pendingEventsCount;

    if (!(pendingEvents && this.props.venues && this.props.organizers && this.props.tags)) {
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
      ['status_NOSORT', 'Status'] // TODO: Make sortable
    ]);
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return ([
      <PaginationLayout
        key={'pending-events-pagination'} pageSize={pageSize} activePage={currentPage} total={pendingEventsCount}
        updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
        schema={'pending-events'}
      />,
      <table className={'schema-table'} key={'pending-events-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingEvents.map(event =>
            <PendingEventRow
              key={`event-${event.id}`} pendingEvent={event}
              venue={venues.find(v => {
                return v.id === event.venue_id
              })}
              organizer={organizers.find(o => {
                return o.id === event.org_id
              })}
              venues={venues} organizers={organizers}
              saveChanges={this.saveChanges} discardListing={this.discardListing}
              eventIsDup={this.queryForSimilar}
            />)
        }
        </tbody>
      </table>
    ]);
  }
};
