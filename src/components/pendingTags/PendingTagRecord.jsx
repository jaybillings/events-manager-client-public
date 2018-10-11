import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingTagRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const id = this.props.pendingTag.id;
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveTag(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingTag.id;
    this.props.deleteTag(id);
  }

  render() {
    const pendingTag = this.props.pendingTag;
    const tagId = pendingTag.target_id || 'N/A';
    const createdAt = Moment(pendingTag.created_at).calendar();
    const updatedAt = Moment(pendingTag.updated_at).calendar();

    return (
      <form id={'pending-tag-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
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
        <div className={'block-warning'} title={'Caution: This tag is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleClickDelete}>Discard Tag</button>
        </div>
      </form>
    );
  }
};
