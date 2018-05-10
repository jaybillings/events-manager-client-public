import React, {Component} from 'react';

import SortIndicator from '../common/SortIndicator';
import VenueRow from './VenueRow';

import '../../styles/schema-table.css';

export default class VenuesTable extends Component {
  constructor(props) {
    super(props);

    this.renderHeader = this.renderHeader.bind(this);
  }

  renderHeader() {
    const titleMap = new Map([
      ['name', 'Name'],
      ['fk_hood', 'Neighborhood'],
      ['updated_at', 'Last Modified']
    ]);
    let headersList = [<th key={'none'}>Actions</th>];

    titleMap.forEach((title, dataKey) => {
      let classNames = 'sort-label', direction = 0;

      if (this.props.sort[0] === dataKey) {
        classNames += ' active';
        direction = this.props.sort[1];
      }

      headersList.push(
        <th className={classNames} key={dataKey} data-sort-type={dataKey} onClick={this.props.handleColumnClick}>
          {title} <SortIndicator direction={direction}/>
        </th>
      );
    });

    return <tr>{headersList}</tr>;
  }

  render() {
    const venues = this.props.venues;
    const neighborhoods = this.props.neighborhoods;

    return (
      <table className={'schema-table'}>
        <thead>
          {this.renderHeader()}
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
