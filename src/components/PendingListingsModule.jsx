import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase, renderTableHeader} from "../utilities";

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";

import '../styles/schema-module.css';
import '../styles/schema-table.css';

export default class PendingListingsModule extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {
      moduleVisible: true, pageSize: this.props.defaultPageSize, currentPage: 1,
      sort: this.props.defaultSortOrder
    };

    this.schema = schema;

    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleDiscardListing = this.handleDiscardListing.bind(this);
    this.handleUpdatePageSize = this.handleUpdatePageSize.bind(this);
    this.handleUpdateCurrentPage = this.handleUpdateCurrentPage.bind(this);
    this.handleUpdateSort = this.handleUpdateSort.bind(this);
    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);
  }

  refreshData() {
    const query = {
      $sort: buildSortQuery(this.state.sort),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };
    this.props.fetchData(query, this.schema);
  }

  publishListings() {
    this.state.pendingListings.forEach(listing => {
      delete(listing.id);
      if (listing.target_id) {
        const target_id = listing.target_id;
        console.log('TARGET ID FOUND');
        //delete(target_id); TODO: Is this necessary?
        // Update
        this.listingsService.update(target_id, listing).then((msg) => {
          console.log(`${this.schema} update`, msg);
          //this.pendingListingsService.remove(listing.id);
        }, err => {
          console.log(`${this.schema} update error`, err);
          this.props.updateMessagePanel({status: 'error', details: err});
        });
      } else {
        // Create
        this.listingsService.create(listing).then((msg) => {
          console.log(`${this.schema} create`, msg);
          //this.pendingListingsService.remove(listing.id);
        }, err => {
          console.log(`${this.schema} create error`, err);
          this.props.updateMessagePanel({status: 'error', details: err});
        });
      }
    });
  }

  handleDiscardListing(id) {
    this.props.discardListing(id, this.schema);
  }

  handleSaveChanges(id, newData) {
    this.props.saveListing(id, newData, this.schema);
  }

  handleUpdatePageSize(e) {
    // TODO: Should parent handle sort?
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.refreshData());
  }

  handleUpdateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.refreshData());
  }

  handleUpdateSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.refreshData());
  }

  toggleModuleVisibility() {
    this.setState(prevState => ({moduleVisible: !prevState.moduleVisible}));
  }

  render() {
    const pendingListings = this.props.pendingListings;
    const pendingListingsCount = pendingListings.length;

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
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const sort = this.state.sort;

    const isVisible = this.state.moduleVisible;
    const visibilityLabel = isVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibilityLabel}>
        <h3>{makeTitleCase(schema)}</h3>
        <ShowHideToggle isVisible={isVisible} changeVisibility={this.toggleModuleVisibility} />
        <div>
          <PaginationLayout
            key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
            total={pendingListingsCount} pageSize={pageSize} activePage={currentPage}
            updatePageSize={this.handleUpdatePageSize} updateCurrentPage={this.handleUpdateCurrentPage}
          />
          <table className={'schema-table'} key={`pending-${schema}-table`}>
            <thead>{renderTableHeader(titleMap, sort, this.handleUpdateSort)}</thead>
            <tbody>
            {
              pendingListings.map(listing =>
                <PendingListingRow
                  key={`${this.schema}-${listing.id}`} schema={schema} pendingListing={listing}
                  saveChanges={this.handleSaveChanges} discardListing={this.handleDiscardListing}
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
