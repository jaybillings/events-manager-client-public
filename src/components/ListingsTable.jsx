import React, {Component} from 'react';
import {renderTableHeader} from '../utilities';

import ListingRow from './ListingRow';
import PaginationLayout from "./common/PaginationLayout";

import '../styles/schema-table.css';

export default class ListingsTable extends Component {
  constructor(props) {
    super(props);
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
        updatePageSize={this.props.updatePageSize} updateCurrentPage={this.props.updateCurrentPage}
      />,
      <table key={`${schema}-table`} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.props.updateColumnSort)}</thead>
        <tbody>
        {
          listings.map(listing =>
            <ListingRow
              key={listing.id} schema={schema} listing={listing}
              updateListing={this.props.updateListing} deleteListing={this.props.deleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
