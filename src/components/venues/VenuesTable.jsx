import React from 'react';
import {renderTableHeader} from "../../utilities";

import ListingsTable from "../ListingsTable";
import VenueRow from './VenueRow';
import PaginationLayout from "../common/PaginationLayout";

/**
 * VenuesTable is a component that displays a table representing a collection of venues, and that table's controls.
 *
 * @note This is a stateless module that should only render. Data manipulation should occur in the VenuesRow class
 * and display should occur in the VenuesLayout class.
 *
 * @class
 * @child
 */
export default class VenuesTable extends ListingsTable {
  /**
   * Renders the component.
   *
   * @returns {*[]}
   */
  render() {
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['fk_hood', 'Neighborhood'],
      ['updated_at', 'Last Modified']
    ]);

    const venues = this.props.listings;
    const hoods = this.props.hoods;

    const pageSize = this.props.pageSize;
    const currentPage = this.props.currentPage;
    const eventsTotal = this.props.listingsTotal;
    const sort = this.props.sort;

    return ([
      <PaginationLayout
        key={'venues-pagination'} schema={'venues'} total={eventsTotal} pageSize={pageSize} activePage={currentPage}
        updatePageSize={this.props.updatePageSize} updateCurrentPage={this.props.updateCurrentPage}
      />,
      <table key={'venues-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.props.updateColumnSort)}</thead>
        <tbody>
        {
          venues.map(venue =>
            <VenueRow
              key={venue.id} listing={venue}
              hood={hoods.find(n => {return n.id === venue.hood_id})} hoods={hoods}
              updateListing={this.props.updateListing} deleteListing={this.props.deleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
