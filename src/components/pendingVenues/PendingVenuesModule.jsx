import React, {Component} from 'react';
import {buildSortQuery, buildColumnSort} from "../../utilities";
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingVenuesTable from './PendingVenuesTable';

export default class PendingVenuesModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingVenues: [], pendingVenuesLoaded: false, pendingVenuesTotal: 0,
      neighborhoods: [], hoodsLoaded: false, pageSize: 5, currentPage: 1, sort: ['created_at', -1]
    };

    this.pendingVenuesService = app.service('pending-venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingVenuesService
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
    this.pendingVenuesService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingVenuesService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({pendingVenues: message.data, pendingVenuesTotal: message.total, pendingVenuesLoaded: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({neighborhoods: message.data, hoodsLoaded: true});
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
    if (!(this.state.pendingVenuesLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>
    }

    return <PendingVenuesTable pendingVenues={this.state.pendingVenues} neighborhoods={this.state.neighborhoods}
                               sort={this.state.sort} handleColumnClick={this.updateColumnSort} />
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingVenuesTotal = this.state.pendingVenuesTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage} total={pendingVenuesTotal}
                          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
                          schema={'pending-venues'} />
        {this.renderTable()}
      </div>
    );
  }
}
