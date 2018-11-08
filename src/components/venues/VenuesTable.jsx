import React from 'react';
import {renderTableHeader} from "../../utilities";

import ListingsTable from "../ListingsTable";
import VenueRow from './VenueRow';
import PaginationLayout from "../common/PaginationLayout";

export default class VenuesTable extends ListingsTable {
  constructor(props) {
    super(props, 'venues');
  }

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
        updatePageSize={this.handlePageSizeUpdate} updateCurrentPage={this.handlePageNumUpdate}
      />,
      <table key={'venues-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, sort, this.props.handleSortUpdate)}</thead>
        <tbody>
        {
          venues.map(venue =>
            <VenueRow
              key={venue.id} listing={venue}
              hood={hoods.find(n => {
                return n.id === venue.hood_id
              })}
              hoods={hoods}
              saveChanges={this.handleSaveChanges} deleteListing={this.handleDeleteListing}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }
};
