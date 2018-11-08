import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';

export default class OrganizerRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();
    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleClickDelete() {
    const id = this.props.org.id;
    this.props.deleteOrg(id);
  }

  handleSubmit(e) {
    e.preventDefault(e);

    const org = this.props.org;
    const id = org.id;
    const newData = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    // Only add non-required if they have a value
    (this.urlInput.current.value !== org.url) && (newData.url = this.urlInput.current.value.trim());
    (this.phoneInput.current.value !== org.phone) && (newData.phone = this.phoneInput.current.value.trim());

    this.props.saveOrg(id, newData);
  }

  render() {
    const org = this.props.org;
    const createdAt = Moment(org['created_at']).calendar();
    const updatedAt = Moment(org['updated_at']).calendar();

    return (
      <form id={'organizer-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          ID
          <input type={'text'} value={org.id} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={org.name} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} defaultValue={org.description} required />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} defaultValue={org.url} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} defaultValue={org.phone} />
        </label>
        <div>
          <button type={'button'} onClick={this.handleClickDelete}>Delete Organizer</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
