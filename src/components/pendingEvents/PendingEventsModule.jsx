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
    this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingEventsService
      .on('created', message => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: 25}, () => this.fetchAllData());
      })
      .on('updated', message => {
        console.log('updated', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: 25}, () => this.fetchAllData());
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
    let query = {
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };

    this.pendingEventsService.find({query: query}).then(message => {
      this.setState({pendingEvents: message.data, pendingEventsTotal: message.total, pendingEventsLoaded: true});
    });
  }

  updateColumnSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState(columnSortState, () => this.fetchAllData());
  }

  renderTable() {
    if (!(this.state.pendingEventsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <PendingEventsTable pendingEvents={this.state.pendingEvents} sort={this.state.sort}
                               handleColumnClick={this.updateColumnSort} />;
  }

  render() {
    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage}
                          total={this.state.pendingEventsTotal} />
        {this.renderTable()}
      </div>
    );
  }
};
