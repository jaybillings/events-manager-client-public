import React, {Component} from 'react';
import {renderTableHeader} from '../../utilities';

import PendingVenueRow from './PendingVenueRow';

import '../../styles/schema-table.css';

export default class PendingVenuesTable extends Component {
  render() {
    const pendingVenues = this.props.pendingVenues;
    const hoods = this.props.neighborhoods;
    const columnSort = this.props.sort;
    const clickHandler = this.props.handleColumnClick;
    const titleMap = new Map([
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingVenues.map(venue => <PendingVenueRow key={`venue-${venue.id}`} pendingVenue={venue}
                                                      neighborhood={hoods.find(h => {
                                                        return h.id === venue.hood_id
                                                      })} neighborhoods={hoods} />)
        }
        </tbody>
      </table>
    );
  }
};
