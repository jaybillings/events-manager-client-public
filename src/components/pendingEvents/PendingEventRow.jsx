import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Moment from 'moment';

import '../../styles/schema-row.css';
import '../../styles/toggle.css';

export default class PendingEventRow extends Component {
  render() {
    const event = this.props.event;
    const createdAt = Moment(event.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td></td>
        <td><Link to={`/pendingEvents/${event.id}`}>{event.name}</Link></td>
        <td>{Moment(event.start_date).format('MM/DD/YYYY')}</td>
        <td>{Moment(event.end_date).format('MM/DD/YYYY')}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
