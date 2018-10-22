import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingOrganizerRow from './PendingOrganizerRow';

import '../../styles/schema-table.css';

export default class PendingOrganizersModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingOrgs: [], pendingOrgsCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.pendingOrgsService = app.service('pending-organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);
    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingOrgsService
      .on('created', message => {
        this.props.updateMessageList(message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessageList(message);
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({status: 'success', details: `Updated ${message.name} successfully.`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList(message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingOrgsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingOrgsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('pending-organizers find', message);
      this.setState({pendingOrgs: message.data, pendingOrgsCount: message.total});
    });
  }

  discardListing(id) {
    this.pendingOrgsService.remove(id).then(message => console.log('removed', message));
  }

  saveChanges(id, newData) {
    this.pendingOrgsService.patch(id, newData).then(message => console.log('patched', message));
  }

  render() {
    const pendingOrgs = this.state.pendingOrgs;
    const pendingOrgsCount = this.state.pendingOrgsCount;

    if (!pendingOrgs) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingOrgsCount === 0) {
      return <p>No pending organizers to list.</p>
    }

    const titleMap = new Map([
      ['name', 'Name'],
      ['created_at', 'Imported On']
    ]);
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return (
      [
        <PaginationLayout
          key={'pending-orgs-pagination'} pageSize={pageSize} activePage={currentPage} total={pendingOrgsCount}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          schema={'pending-organizers'}
        />,
        <table className={'schema-table'} key={'pending-orgs-table'}>
          <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
          <tbody>
          {pendingOrgs.map(org =>
            <PendingOrganizerRow key={`org-${org.id}`} pendingOrganizer={org}
                                 saveChanges={this.saveChanges} discsrdListing={this.discardListing} />)}
          </tbody>
        </table>
      ]
    );
  }
};
