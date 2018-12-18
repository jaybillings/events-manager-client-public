import React, {Component} from 'react';
import Moment from 'moment';
import {makeSingular, makeTitleCase} from "../utilities";

import '../styles/schema-record.css';

export default class ListingRecordUniversal extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault(e);

    this.props.updateListing(this.props.listing.id, { name: this.nameInput.current.value});
  }

  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  render() {
    const listing = this.props.listing;
    const schema = this.props.schema;
    const singularTitleCaseSchema = makeSingular(makeTitleCase(schema));
    const createdAt = Moment(listing.created_at).calendar();
    const updatedAt = Moment(listing.updated_at).calendar();

    return (
      <form id={`${schema}-listing-form`} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          UUID
          <input type={'text'} value={listing.uuid} readOnly />
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
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleDeleteClick}>Delete {singularTitleCaseSchema}</button>
        </div>
      </form>
    );
  }
};
