import React, {Component} from 'react';

import OrganizerRow from './OrganizerRow';

import '../../styles/schema-table.css';

export default class OrganizersTable extends Component {
  render() {
    const organizers = this.props.organizers;

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
        {
          organizers.map(org => <OrganizerRow key={org.id} organizer={org} />)
        }
        </tbody>
      </table>
    );
  }
};
