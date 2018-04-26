import React, {Component} from 'react';

import VenueRow from './VenueRow';

import '../../styles/schema-table.css';

export default class VenuesTable extends Component {
  render() {
    const venues = this.props.venues;
    const neighborhoods = this.props.neighborhoods;

    return (
      <table className={'schema-table'}>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Neighborhood</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {
          venues.map(venue =>
            <VenueRow
              key={venue.id} venue={venue}
              neighborhood={neighborhoods.find(n => { return n.id === venue.hood_id })}
              neighborhoods={neighborhoods}
            />
          )
        }
        </tbody>
      </table>
    );
  }
};
