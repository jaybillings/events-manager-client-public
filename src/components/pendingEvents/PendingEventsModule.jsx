import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from '../../utilities';

import PaginationLayout from '../common/PaginationLayout';
import PendingEventRow from './PendingEventRow';

import '../../styles/schema-table.css';

export default class PendingEventsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingEvents: this.props.pendingEvents, pendingEventsTotal: this.props.pendingEventsTotal,
      pageSize: this.props.pageSize, sort: this.props.sort, currentPage: 1
    };

    this.fetchPendingEvents = this.fetchPendingEvents.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.props.updateColumnSort.bind(this);
    this.updatePageSize = this.props.updatePageSize.bind(this);
    this.updateCurrentPage = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.props.pendingEventsService
      .on('created', message => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchPendingEvents());
      })
      .on('updated', message => {
        console.log('updated', message);
        this.fetchPendingEvents();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchPendingEvents());
      })
      .on('error', error => {
        console.log('pending-events created ', error);
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.props.pendingEventsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchPendingEvents() {
    this.pendingEventsService.find({
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    }).then(message => {
      this.setState({pendingEvents: message.data, pendingEventsTotal: message.total});
    });
  }

  renderTable() {
    if (!(this.state.pendingEvents && this.props.venues && this.props.organizers && this.props.tags)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const pendingEvents = this.props.pendingEvents;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const columnSort = this.props.sort;
    const clickHandler = this.props.updateColumnSort;
    const titleMap = new Map([
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['venue_id', 'Venue'],
      ['org_id', 'Organizer'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingEvents.map(event =>
            <PendingEventRow key={`event-${event.id}`} pendingEvent={event}
                             venue={venues.find(v => {
                               return v.id === event.venue_id
                             })}
                             organizer={organizers.find(o => {
                               return o.id === event.org_id
                             })}
                             venues={venues} organizers={organizers} />
          )
        }
        </tbody>
      </table>
    );
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingEventsTotal = this.state.pendingEventsTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage}
                          total={pendingEventsTotal} updatePageSize={this.props.updatePageSize}
                          updateCurrentPage={this.props.updateCurrentPage} schema={'pending-events'} />
        {this.renderTable()}
      </div>
    );
  }
};
