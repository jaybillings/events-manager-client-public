import React, {Component} from "react";
import Moment from "moment";
import {makeSingular, makeTitleCase} from "../utilities";

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

    this.nameInput = React.createRef();

    this.checkWriteStatus = this.checkWriteStatus.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
   *
   *   @returns {string} writeStatus
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
    });
  }

  /**
   * Handles the submit action by parsing new data and calling a function to create a new listing.
   * @param {Event} e
   */
  handleSubmit(e) {
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
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const listing = this.props.listing;
    const schema = this.props.schema;
    const singularTitleCaseSchema = makeSingular(makeTitleCase(schema));
    /** @var {string} listing.created_at */
    const createdAt = Moment(listing.created_at).calendar();
    /** @var {string} listing.updated_at */
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
