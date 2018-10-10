import React, {Component} from 'react';
import {buildSortQuery, buildColumnSort} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingOrganizersTable from './PendingOrganizersTable';

export default class PendingOrganizersModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingOrganizers: [], pendingOrgsLoaded: false, pendingOrgsTotal: 0,
      pageSize: 5, currentPage: 1, sort: ['created_at', -1]
    };

    this.pendingOrganizersService = app.service('pending-organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingOrganizersService
      .on('created', message => {
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.fetchAllData();
      })
      .on('removed', message => {
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingOrganizersService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingOrganizersService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find', message);
      this.setState({pendingOrganizers: message.data, pendingOrgsTotal: message.total, pendingOrgsLoaded: true});
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
    if (!this.state.pendingOrgsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.pendingOrgsTotal === 0) {
      return <p>No pending organizers to list.</p>
    } else {
      return <PendingOrganizersTable pendingOrganizers={this.state.pendingOrganizers} sort={this.state.sort}
                                     handleColumnClick={this.updateColumnSort} />
    }
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingOrgsTotal = this.state.pendingOrgsTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage}
                          total={pendingOrgsTotal} updatePageSize={this.updatePageSize}
                          updateCurrentPage={this.updateCurrentPage} schema={'pending-organizers'} />
        {this.renderTable()}
      </div>
    );
  }
};
