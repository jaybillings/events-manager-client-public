import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from "../../utilities";
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingVenueRow from './PendingVenueRow';

import '../../styles/schema-table.css';

export default class PendingVenuesModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingVenues: [], pendingVenuesCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.pendingVenuesService = app.service('pending-venues');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);
    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingVenuesService
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
    this.pendingVenuesService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('patched')
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
      console.log('find pending-venues', message);
      this.setState({pendingVenues: message.data, pendingVenuesCount: message.total});
    });
  }

  discardListing(id) {
    this.pendingVenuesService.remove(id).then(message => console.log('removed', message));
  }

  saveChanges(id, newData) {
    this.pendingVenuesService.patch(id, newData).then(message => console.log('patched', message));
  }

  render() {
    const pendingVenues = this.state.pendingVenues;
    const pendingVenuesCount = this.state.pendingVenuesCount;

    if (!(pendingVenues && this.props.neighborhoods)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesCount === 0) {
      return <p>No pending venues to list.</p>;
    }

    const titleMap = new Map([
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On']
    ]);
    const hoods = this.props.neighborhoods;
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return (
      [
        <PaginationLayout
          key={'pending-venues-pagination'}
          pageSize={pageSize} activePage={currentPage} total={pendingVenuesCount}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          schema={'pending-venues'}
        />,
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} pendingVenue={venue}
                neighborhood={hoods.find(h => {
                  return h.id === venue.hood_id
                })}
                neighborhoods={hoods} saveChanges={this.saveChanges} discardListing={this.discardListing}
              />)
          }
          </tbody>
        </table>
      ]
    );
  }
}
