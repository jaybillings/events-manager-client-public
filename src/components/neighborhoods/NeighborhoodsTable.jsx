import React, {Component} from 'react';

import NeighborhoodRow from './NeighborhoodRow';
import '../../styles/schema-table.css';

export default class NeighborhoodsTable extends Component {
  render() {
    const neighborhoods = this.props.neighborhoods;

    return (
      <table className={'schema-table'}>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {neighborhoods.map(hood => <NeighborhoodRow key={hood.id} neighborhood={hood}/>)}
        </tbody>
      </table>
    );
  }
};
