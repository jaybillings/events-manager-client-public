import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import app from '../../services/socketio';

export default class PendingTagRow extends Component {
  constructor(props) {
    super(props);

    this.pendingTagService = app.service('pending-tags');

    this.discardPendingTag = this.discardPendingTag.bind(this);
  }

  discardPendingTag() {
    this.pendingTagService.remove(this.props.pendingTag.id).then(message => console.log('removed', message));
  }

  render() {
    const pendingTag = this.props.pendingTag;
    const createdAt = Moment(pendingTag.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td><button type={'button'} onClick={this.discardPendingTag}>Discard</button></td>
        <td><Link to={`/pendingTags/${pendingTag.id}`}>{pendingTag.name}</Link></td>
        <td>{Moment(pendingTag.start_date).format('MM/DD/YYYY')}</td>
        <td>{Moment(pendingTag.end_date).format('MM/DD/YYYY')}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
