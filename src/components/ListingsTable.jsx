import React, {Component} from 'react';
import {renderTableHeader} from '../utilities';

import ListingRow from './ListingRow';
import PaginationLayout from "./common/PaginationLayout";

import '../styles/schema-table.css';

export default class ListingsTable extends Component {
  constructor(props) {
    super(props);

    this.handleSaveChanges = this.handleSaveChanges.bind(this);
    this.handleDeleteListing = this.handleDeleteListing.bind(this);
    this.handleUpdatePageSize = this.handleUpdatePageSize.bind(this);
    this.handleUpdateCurrentPage = this.handleUpdateCurrentPage.bind(this);
    this.handleUpdateSort = this.handleUpdateSort.bind(this);
  }

  handleDeleteListing(id) {
    this.props.deleteListing(id);
  }

  handleSaveChanges(id, newData) {
    this.props.saveListing(id, newData);
  }

  handleUpdatePageSize(e) {
    this.props.handleUpdatePageSize(e);
  }

  handleUpdateCurrentPage(page) {
    this.props.handleUpdateCurrentPage(page);
  }

  handleUpdateSort(e) {
    this.props.handleUpdateSort(e);
  }

  render() {
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['updated_at', 'Last Modified']
    ]);

    const listings = this.props.listings;
    const schema = this.props.schema;

    const pageSize = this.props.pageSize;
    const currentPage = this.props.currentPage;
    const listingsTotal = this.props.listingsTotal;
    const sort = this.props.sort;

    return ([
      <PaginationLayout
        key={`${schema}-pagination`} schema={schema} total={listingsTotal} pageSize={pageSize} activePage={currentPage}
        updatePageSize={this.handleUpdatePageSize} updateCurrentPage={this.handleUpdateCurrentPage}
      />,
      <table key={`${schema}-table`} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.handleUpdateSort)}</thead>
        <tbody>
        {
          listings.map(listing =>
            <ListingRow
              key={listing.id} schema={schema} listing={listing}
              saveChanges={this.handleSaveChanges} deleteListing={this.handleDeleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
