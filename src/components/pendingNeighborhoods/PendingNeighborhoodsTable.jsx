import React, {Component} from 'react';
import {renderTableHeader} from "../../utilities";

import PendingNeighborhoodRow from './PendingNeighborhoodRow';

import '../../styles/schema-table.css';

export default class pendingNeighborhoodsTable extends Component {
  render() {
    const pendingHoods = this.props.pendingHoods;
    const columnSort = this.props.sort;
    const clickHandler = this.props.handleColumnClick;
    const titleMap = new Map([
      ['Name', 'name'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingHoods.map(hood => <PendingNeighborhoodRow key={`hood-${hood.id}`} pendingHood={hood} />)
        }
        </tbody>
      </table>
    );
  }
};
