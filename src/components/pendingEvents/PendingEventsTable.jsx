import React, {Component} from 'react';

import SortIndicator from '../common/SortIndicator';
import PendingEventRow from './PendingEventRow';

import '../../styles/schema-table.css';

export default class PendingEventsTable extends Component {
  constructor(props) {
    super(props);

    this.renderHeader = this.renderHeader.bind(this);
  }

  renderHeader() {
    const titleMap = new Map([
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['created_at', 'Imported On']
    ]);
    let headersList = [<th key={'none'}>Actions</th>];

    titleMap.forEach((title, dataKey) => {
      let classNames = 'sort-label', direction = 0;

      // TODO: Is 'active' being used?
      if (this.props.sort[0] === dataKey) {
        classNames += ' active';
        direction = this.props.sort[1];
      }

      headersList.push(
        <th className={classNames} key={dataKey} data-sort-type={dataKey} onClick={this.props.handleColumnClick}>
          {title} <SortIndicator direction={direction} />
        </th>
      );
    });

    return <tr>{headersList}</tr>;
  }

  render() {
    const pendingEvents = this.props.pendingEvents;

    return (
      <table className={'schema-table'}>
        <thead>{this.renderHeader()}</thead>
        <tbody>
        {
          pendingEvents.map(event =>
            <PendingEventRow key={event.id} event={event} />
          )
        }
        </tbody>
      </table>
    );
  }
};
