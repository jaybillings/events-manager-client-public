import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

import '../../styles/schema-row.css';

export default class PendingVenueRow extends Component {
  constructor(props) {
    super(props);

    this.pendingVenueService = app.service('pending-venues');

    this.discardPendingVenue = this.discardPendingVenue.bind(this);
  }

  discardPendingVenue() {
    this.pendingVenueService.remove(this.props.pendingVenue.id).then(message => console.log('deleted', message));
  }

  render() {
    const pendingVenue = this.props.pendingVenue;
    const hoodLink = this.props.hood ?
      <Link to={`/pendingNeighborhoods/${pendingVenue.hood_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const createdAt = Moment(pendingVenue.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.discardPendingVenue}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingVenue.id}`}>{pendingVenue.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
