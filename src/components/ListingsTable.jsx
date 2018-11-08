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
    this.handlePageSizeUpdate = this.handlePageSizeUpdate.bind(this);
    this.handlePageNumUpdate = this.handlePageNumUpdate.bind(this);
    this.handleSortUpdate = this.handleSortUpdate.bind(this);
  }

  handleDeleteListing(id) {
    this.props.deleteListing(id);
  }

  handleSaveChanges(id, newData) {
    this.props.saveListing(id, newData);
  }

  handlePageSizeUpdate(e) {
    this.props.updatePageSize(e);
  }

  handlePageNumUpdate(page) {
    this.props.updateCurrentPage(page);
  }

  handleSortUpdate(e) {
    this.props.updateColumnSort(e);
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
        updatePageSize={this.handlePageSizeUpdate} updateCurrentPage={this.handlePageNumUpdate}
      />,
      <table key={`${schema}-table`} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.handleSortUpdate)}</thead>
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
