import React, {Component} from "react";
import Moment from "moment";
import app from '../services/socketio';
import {makeSingular} from "../utilities";

import "../styles/schema-record.css";

/**
 * ListingRecordUniversal is a generic component which displays a single listing record.
 *
 * @class
 * @parent
 */
export default class ListingRecordUniversal extends Component {
  constructor(props) {
    super(props);

    this.state = {writeStatus: ''};

    this.user = app.get('user');
    this.nameInput = React.createRef();

    this.getWriteStatus = this.getWriteStatus.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  /**
   * `getWriteStatus` determines how a pending listing relates to the published data.
   *
   * Returns a label indicating what will happen to a given listing when published.
   * Possible results are:
   *   - "new": will make a new listing
   *   - "update": will update a preexisting listing
   *   - "duplicate": will make a new listing that might duplicate an existing listing
   */
  async getWriteStatus() {
    const listing = this.props.listing;

    console.debug(this.props);

    if (this.props.matchingLiveListing) return 'update';

    const similarListings = await this.props.queryForDuplicate(listing);

    if (similarListings.total) return 'duplicate';

    return 'new';
  }

  /**
   * `handleSaveClick` parses the new data and calls a function to create a new listing.
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();
    this.props.updateListing({name: this.nameInput.current.value});
  }

  /**
   * `handleDeleteClick` calls a function to delete the listing.
   */
  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const listing = this.props.listing;
    const schema = this.props.schema;
    const createdAt = Moment(listing.created_at).calendar();
    const updatedAt = Moment(listing.updated_at).calendar();

    const publishButton = schema.indexOf('pending') !== -1 || this.user.is_su
      ? <button type={'submit'} className={'button-primary'}>Save Changes</button> : '';
    const deleteButton = schema.indexOf('pending') !== -1 || this.user.is_admin
      ? <button type={'button'} className={'warn'}
                onClick={this.handleDeleteClick}>Delete {makeSingular(schema)}</button> : '';
    const disableAll = schema.indexOf('pending') !== -1 && !this.user.is_su;

    return (
      <form id={`${schema}-listing-form`} className={'schema-record'} onSubmit={this.handleSaveClick}>
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
          <input type={'text'} ref={this.nameInput} defaultValue={listing.name} maxLength={100} disabled={disableAll}
                 required />
        </label>
        <div>
          {deleteButton}
          {publishButton}
        </div>
      </form>
    );
  }
};
