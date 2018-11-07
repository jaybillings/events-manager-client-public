import React, {Component} from 'react';

import SortIndicator from "../common/SortIndicator";
import OrganizerRow from './OrganizerRow';

import '../../styles/schema-table.css';

export default class OrganizersTable extends Component {
  constructor(props) {
    super(props);

    this.renderHeader = this.renderHeader.bind(this);
  }

  renderHeader() {
    const titleMap = new Map([
      ['name', 'Name'],
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

    return <tr>{headersList}</tr>
  }

  render() {
    const organizers = this.props.organizers;

    return (
      <table className={'schema-table'}>
        <thead>
        {this.renderHeader()}
        </thead>
        <tbody>
        {
          organizers.map(org => <OrganizerRow key={org.id} listing={org} />)
        }
        </tbody>
      </table>
    );
  }
};
