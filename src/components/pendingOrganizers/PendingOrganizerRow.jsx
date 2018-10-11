import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

import '../../styles/schema-row.css';

export default class PendingOrganizerRow extends Component {
  constructor(props) {
    super(props);

    this.pendingOrgService = app.service('pending-organizers');

    this.discardPendingOrg = this.discardPendingOrg.bind(this);
  }

  discardPendingOrg() {
    this.pendingOrgService.remove(this.props.pendingOrganizer.id).then(message => console.log('deleted', message));
  }

  render() {
    const pendingOrg = this.props.pendingOrganizer;
    const createdAt = Moment(pendingOrg.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.discardPendingOrg}>Discard</button>
        </td>
        <td><Link to={`/pendingOrganizers/${pendingOrg.id}`}>{pendingOrg.name}</Link></td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
