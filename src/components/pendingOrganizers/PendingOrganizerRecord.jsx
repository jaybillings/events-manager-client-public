import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';

export default class PendingOrganizerRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();
    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const pendingOrg = this.props.pendingOrg;
    const id = pendingOrg.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have a value
    (this.urlInput.current.value !== pendingOrg.url) && (newData.url = this.urlInput.current.value.trim());
    (this.phoneInput.current.value !== pendingOrg.phone) && (newData.phone = this.phoneInput.current.value.trim());

    this.props.saveOrg(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingOrg.id;
    this.props.deleteOrg(id);
  }

  render() {
    const pendingOrg = this.props.pendingOrg;
    const orgId = pendingOrg.target_id || 'N/A';
    const createdAt = Moment(pendingOrg.created_at).calendar();
    const updatedAt = Moment(pendingOrg.updated_at).calendar();

    return (
      <form id={'pending-org-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Organizer ID
          <input type={'text'} value={orgId} disabled />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} value={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={pendingOrg.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={pendingOrg.description} required maxLength={500} />
        </label>
        <label>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={pendingOrg.url} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={pendingOrg.phone} />
        </label>
        <div className={'block-warning'} title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleClickDelete}>Discard Organizer</button>
        </div>
      </form>
    )
  }
}
