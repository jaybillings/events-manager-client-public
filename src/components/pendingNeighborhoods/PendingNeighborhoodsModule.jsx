import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingNeighborhoodRow from './PendingNeighborhoodRow';

import '../../styles/schema-table.css';

export default class PendingNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingHoods: [], pendingHoodsCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingHoodsService
      .on('created', message => {
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.fetchAllData();
      })
      .on('removed', message => {
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingHoodsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingHoodsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find pending-neighborhoods', message);
      this.setState({pendingHoods: message.data, pendingHoodsCount: message.total});
    });
  }

  render() {
    const pendingHoods = this.state.pendingHoods;
    const pendingHoodsCount = this.state.pendingHoodsCount;

    if (!pendingHoods) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingHoodsCount === 0) {
      return <p>No pending neighborhoods to list.</p>
    }

    const titleMap = new Map([
      ['Name', 'name'],
      ['created_at', 'Imported On']
    ]);
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return (
      [
        <PaginationLayout
          key={'pending-hoods-pagination'} pageSize={pageSize} activePage={currentPage} total={pendingHoodsCount}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          schema={'pending-neighborhoods'}
        />,
        <table className={'schema-table'} key={'pending-hoods-table'}>
          <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
          <tbody>
          {
            pendingHoods.map(hood => <PendingNeighborhoodRow key={`hood-${hood.id}`} pendingNeighborhood={hood} />)
          }
          </tbody>
        </table>
      ]
    );
  }
};
