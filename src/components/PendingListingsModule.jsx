import React, {Component} from "react";
import {buildSortQuery, makeTitleCase, renderTableHeader} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";

import '../styles/schema-module.css';
import '../styles/schema-table.css';

export default class PendingListingsModule extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.schema = schema;
    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);
    this.queryForSimilar = this.queryForSimilar.bind(this);
    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);

    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({status: 'success', details: `Added ${message.name} with ID #${message.id}`});
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessageList(message);
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({status: 'success', details: `Updated #${message.id} - ${message.name}`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Discarded ${this.schema} #${message.id} - ${message.name}`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingListingsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingListingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({pendingListings: message.data, pendingListingsCount: message.total});
    });
  }

  discardListing(id) {
    this.pendingListingsService.remove(id).then(message => console.log('removed', message));
  }

  saveChanges(id, newData) {
    this.pendingListingsService.patch(id, newData).then(message => console.log('patched', message));
  }

  async queryForSimilar(pendingListing) {
    return this.listingsService.find({
      query: {
        name: pendingListing.name,
        start_date: pendingListing.start_date,
        end_date: pendingListing.end_date
      }
    });
  }

  toggleModuleVisibility() {
    this.setState(prevState => ({moduleVisible: !prevState.moduleVisible}));
  }

  render() {
    const pendingListings = this.state.pendingListings;
    const pendingListingsCount = this.state.pendingListingsCount;

    if (!pendingListings) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingListingsCount === 0) {
      return <p>No pending {this.schema} to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const schema = this.schema;
    const isVisible = this.state.moduleVisible;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const sort = this.state.sort;
    const visibility = isVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>{makeTitleCase(schema)}</h3>
        <ShowHideToggle isVisible={isVisible} changeVisibility={this.toggleModuleVisibility} />
        <div>
          <PaginationLayout
            key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
            total={pendingListingsCount} pageSize={pageSize} activePage={currentPage}
            updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          />
          <table className={'schema-table'} key={`pending-${schema}-table`}>
            <thead>{renderTableHeader(titleMap, sort, this.updateColumnSortSelf)}</thead>
            <tbody>
            {
              pendingListings.map(listing =>
                <PendingListingRow
                  key={`${this.schema}-${listing.id}`} schema={schema} pendingListing={listing}
                  saveChanges={this.saveChanges} discardListing={this.discardListing}
                  listingIsDup={this.queryForSimilar}
                />)
            }
            </tbody>
          </table>
          <p>0 / {pendingListingsCount} {schema} selected</p>
        </div>
      </div>
    )
  }
};
