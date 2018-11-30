import React, {Component} from 'react';
import Moment from 'moment';
import {makeTitleCase} from "../utilities";

import '../styles/schema-record.css';
import '../styles/toggle.css';

export default class ListingRecordUniversal extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleClickDelete() {
    this.props.deleteListing(this.props.listing.id);
  }

  handleSubmit(e) {
    e.preventDefault(e);

    const listing = this.props.listing;
    const newData = {
      name: this.nameInput.current.value.trim()
    };

    this.props.saveListing(listing.id, newData);
  }

  render() {
    // TODO: Needs to be a way to select UUID for copy
    const listing = this.props.listing;
    const schema = this.props.schema;
    const titleCaseSchema = makeTitleCase(schema);
    const createdAt = Moment(listing.created_at).calendar();
    const updatedAt = Moment(listing.updated_at).calendar();

    return (
      <form id={`${schema}-listing-form`} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={listing.uuid} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={listing.name} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} onClick={this.handleClickDelete}>Delete {titleCaseSchema}</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
