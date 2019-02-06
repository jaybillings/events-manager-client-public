import React, {Component} from "react";
import Moment from "moment";
import {makeSingular} from "../utilities";
import app from '../services/socketio';

import "../styles/schema-record.css";

/**
 * ListingRecordUniversal is a generic component which displays a single listing record.
 * @class
 * @parent
 */
export default class ListingRecordUniversal extends Component {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.user = app.get('user');
    this.nameInput = React.createRef();

    this.checkWriteStatus = this.checkWriteStatus.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  /**
   * Checks the publish/write status of a single listing.
   *
   * checkWriteStatus checks the status of a single listing -- what will potentially happen if it's published. Possible
   * results are:
   *   - new (will make a new listing)
   *   - update (will update a preexisting listing)
   *   - duplicate (will make a new listing that might duplicate an existing listing)
   */
  checkWriteStatus() {
    this.props.queryForExisting(this.state.listing).then(message => {
      let writeStatus;

      if (!message.total) {
        writeStatus = 'new';
      } else {
        const uuids = message.data.map(row => row.uuid);
        if (uuids.includes(this.props.listing.uuid)) {
          writeStatus = 'update';
        } else {
          writeStatus = 'duplicate';
        }
      }

      this.setState({writeStatus});
    }, err => {
      console.log('error in checking write status', JSON.stringify(err));
    });
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new listing.
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    this.props.updateListing({name: this.nameInput.current.value});
  }

  /**
   * Handles the delete button click by calling a function to delete the listing.
   */
  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  /**
   * Renders the component.
   * @override
   *
   * @render
   * @returns {*}
   */
  render() {
    const listing = this.props.listing;
    const schema = this.props.schema;
    const createdAt = Moment(listing.created_at).calendar();
    const updatedAt = Moment(listing.updated_at).calendar();

    const deleteButton = schema.indexOf('pending') !== -1 || app.get('user').is_admin
      ? <button type={'button'} onClick={this.handleDeleteClick}>Delete {makeSingular(schema)}</button> : '';

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
          <input type={'text'} ref={this.nameInput} defaultValue={listing.name} required maxLength={100} />
        </label>
        <div>
          {deleteButton}
          <button type={'button'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
