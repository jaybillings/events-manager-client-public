import React, {Component} from 'react';
import {buildSortQuery, buildColumnSort} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingTagsTable from './PendingTagsTable';

export default class PendingTagsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingTags: [], pendingTagsLoaded: false, pendingTagsTotal: 0,
      pageSize: 5, currentPage: 1, sort: ['created_at', -1]
    };

    this.pendingTagsService = app.service('pending-tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingTagsService
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
    this.pendingTagsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingTagsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find', message);
      this.setState({pendingTags: message.data, pendingTagsTotal: message.total, pendingTagsLoaded: true});
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
    if (!this.state.pendingTagsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.pendingTagsTotal === 0) {
      return <p>No pending tags to list.</p>
    } else {
      return <PendingTagsTable pendingTags={this.state.pendingTags} sort={this.state.sort}
                               handleColumnClick={this.updateColumnSort} />
    }
  }

  render() {
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;
    const pendingTagsTotal = this.state.pendingTagsTotal;

    return (
      <div className={'schema-module'}>
        <PaginationLayout pageSize={pageSize} activePage={currentPage}
                          total={pendingTagsTotal} updatePageSize={this.updatePageSize}
                          updateCurrentPage={this.updateCurrentPage} schema={'pending-tags'} />
        {this.renderTable()}
      </div>
    );
  }
};
