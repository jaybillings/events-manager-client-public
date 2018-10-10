import React, {Component} from 'react';
import {buildSortQuery, buildColumnSort} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingNeighborhoodsTable from './PendingNeighborhoodsTable';

export default class PendingNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingNeighborhoods: [], pendingHoodsLoaded: false, pendingHoodsTotal: 0,
      pageSize: 5, currentPage: 1, sort: ['created_at', -1]
    };

    this.pendingNeighborhoodsService = app.service('pending-hoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingNeighborhoodsService
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
    this.pendingNeighborhoodsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingNeighborhoodsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find', message);
      this.setState({pendingNeighborhoods: message.data, pendingHoodsTotal: message.total, pendingHoodsLoaded: true});
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
    if (!this.state.pendingHoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.pendingHoodsTotal === 0) {
      return <p>No pending hoods to list.</p>
    } else {
      return <PendingNeighborhoodsTable pendingNeighborhoods={this.state.pendingNeighborhoods} sort={this.state.sort}
                               handleColumnClick={this.updateColumnSort} />
    }
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingHoodsTotal = this.state.pendingHoodsTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage}
                          total={pendingHoodsTotal} updatePageSize={this.updatePageSize}
                          updateCurrentPage={this.updateCurrentPage} schema={'pending-hoods'} />
        {this.renderTable()}
      </div>
    );
  }
};
