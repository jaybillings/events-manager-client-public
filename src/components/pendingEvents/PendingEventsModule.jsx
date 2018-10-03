import React, {Component} from 'react';
import {buildSortQuery, buildColumnSort} from '../../utilities';
import app from "../../services/socketio";

import PaginationLayout from '../common/PaginationLayout';
import PendingEventsTable from './PendingEventsTable';

export default class PendingEventsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingEvents: [], pendingEventsLoaded: false, pendingEventsTotal: 0,
      venues: [], organizers: [], tags: [],
      venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      pageSize: 5, currentPage: 1, sort: ['created_at', -1]
    };

    this.pendingEventsService = app.service('pending-events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    //this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingEventsService
      .on('created', message => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
      })
      .on('updated', message => {
        console.log('updated', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
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
    const eventQuery = {
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };
    const defaultQuery = {$sort: {name: 1}};

    this.pendingEventsService.find({query: eventQuery}).then(message => {
      this.setState({pendingEvents: message.data, pendingEventsTotal: message.total, pendingEventsLoaded: true});
    });

    this.venuesService.find({query: defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true});
    });

    this.orgsService.find({query: defaultQuery}).then(message => {
      this.setState({organizers: message.data, orgsLoaded: true});
    });
  }

  updateColumnSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState(columnSortState, () => this.fetchAllData());
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  renderTable() {
    if (!(this.state.pendingEventsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <PendingEventsTable pendingEvents={this.state.pendingEvents} venues={this.state.venues}
                               organizers={this.state.organizers} sort={this.state.sort}
                               handleColumnClick={this.updateColumnSort} />;
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingEventsTotal = this.state.pendingEventsTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage}
                          total={pendingEventsTotal} updatePageSize={this.updatePageSize}
                          updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
      </div>
    );
  }
};
