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

    this.fetchAllData = this.fetchAllData.bind(this);
    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingEventsService
      .on('created', message => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        console.log('updated', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        console.log('pending-events created ', error);
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingEventsService
      .removeListener('created')
      .removeListener('updated')
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

  render() {
    const pendingEvents = this.state.pendingEvents;
    const pendingEventsCount = this.state.pendingEventsCount;

    if (!(pendingEvents && this.props.venues && this.props.organizers && this.props.tags)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingEventsCount === 0) {
      return <p>No pending events to list.</p>
    }

    const titleMap = new Map([
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['venue_id', 'Venue'],
      ['org_id', 'Organizer'],
      ['created_at', 'Imported On']
    ]);
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return (
      [
        <PaginationLayout
          pageSize={pageSize} activePage={currentPage} total={pendingEventsCount}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          schema={'pending-events'}
        />,
        <table className={'schema-table'}>
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
                venues={venues} organizers={organizers} />
            )
          }
          </tbody>
        </table>
      ]
    );
  }
};
