import React, {Component} from 'react';
import {renderTableHeader} from '../utilities';

import ListingRow from './ListingRow';
import PaginationLayout from "./common/PaginationLayout";

import '../styles/schema-table.css';

/**
 * ListingsTable is a generic component that displays a table representing a collection of listings, and that table's
 * controls.
 *
 * @note This is a stateless module. Data manipulation should occur in the *Row class and display should occur in the
 * *Layout class.
 *
 * @class
 * @parent
 */
export default class ListingsTable extends Component {
  /**
   * Renders the component.
   *
   * @returns {*[]}
   */
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
