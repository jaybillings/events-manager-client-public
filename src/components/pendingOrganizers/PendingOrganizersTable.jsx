import React, {Component} from 'react';
import {renderTableHeader} from '../../utilities';

import PendingOrganizerRow from './PendingOrganizerRow';

import '../../styles/schema-table.css';

export default class PendingOrganizersTable extends Component {
  render() {
    const pendingOrgs = this.props.pendingOrgs;
    const columnSort = this.props.sort;
    const clickHandler = this.props.handleColumnClick;
    const titleMap = new Map([
      ['name', 'Name'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingOrgs.map(org => <PendingOrganizerRow key={`org-${org.id}`} pendingOrg={org} />)
        }
        </tbody>
      </table>
    );
  }
}
