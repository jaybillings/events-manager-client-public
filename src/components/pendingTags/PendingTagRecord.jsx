import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingTagRecord extends Component {
  constructor(props) {
    super(props);

    this.state = {hasDeleted: false};

    this.nameInput = React.createRef();
    this.btnDelete = React.createRef();
    this.btnSave = React.createRef();
  }

  render() {
    const pendingTag = this.props.pendingTag;
    const tagId = pendingTag['tagret_id'] || 'N/A';
    const createdAt = Moment(pendingTag['created_at']).calendar();
    const updatedAt = Moment(pendingTag['updated_at']).calendar();

    return (
      <form id={'pending-tag-listing-form'} className={'schema-record'} onSubmit={this.props.saveTag}>
        <label>
          Live Tag ID
          <input type={'text'} defaultValue={tagId} disabled />
        </label>
        <label>
          Created
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} defaultValue={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={pendingTag.name} required maxLength={100} />
        </label>
        <div className={'block-warning'} title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'button'} ref={this.btnDelete} onClick={this.props.deleteTag}>Discard Tag</button>
          <button type={'submit'} ref={this.btnSave} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
