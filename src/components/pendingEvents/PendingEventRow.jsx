import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Moment from 'moment';
import app from '../../services/socketio';

import '../../styles/schema-row.css';

export default class PendingEventRow extends Component {
  constructor(props) {
    super(props);

    this.pendingEventService = app.service('pending-events');

    this.discardPendingEvent = this.discardPendingEvent.bind(this);
  }

  discardPendingEvent() {
    this.pendingEventService.remove(this.props.pendingEvent.id).then(message => console.log('remove', message));
  }

  render() {
    const pendingEvent = this.props.pendingEvent;
    const venueLink = this.props.venue ?
      <Link to={`/venues/${pendingEvent.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.organizer ?
      <Link to={`/organizers/${pendingEvent.org_id}`}>{this.props.organizer.name}</Link> : 'NO ORGANIZER';
    const createdAt = Moment(pendingEvent.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.discardPendingEvent}>Discard</button>
        </td>
        <td><Link to={`/pendingEvents/${pendingEvent.id}`}>{pendingEvent.name}</Link></td>
        <td>{Moment(pendingEvent.start_date).format('MM/DD/YYYY')}</td>
        <td>{Moment(pendingEvent.end_date).format('MM/DD/YYYY')}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
