import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

import '../../styles/schema-row.css';

export default class PendingNeighborhoodRow extends Component {
  constructor(props) {
    super(props);

    this.pendingHoodService = app.service('pending-neighborhoods');

    this.discardPendingHood = this.discardPendingHood.bind(this);
  }

  discardPendingHood() {
    this.pendingHoodService.remove(this.props.pendingNeighborhood.id).then(message => console.log('remove', message));
  }

  render() {
    const pendingHood = this.props.pendingHood;
    const createdAt = Moment(pendingHood.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.discardPendingHood}>Discard</button>
        </td>
        <td><Link to={`/pendingNeighborhoods/${pendingHood.id}`}>{pendingHood.name}</Link></td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
