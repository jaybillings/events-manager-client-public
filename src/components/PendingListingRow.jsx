import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from "react-router-dom";

import StatusLabel from "./common/StatusLabel";

import "../styles/schema-row.css";
import {diffListings} from "../utilities";

/**
 * PendingListingRow is a generic component that displays a single row from a pending listings table.
 * @class
 * @parent
 */
export default class PendingListingRow extends Component {
  /**
   * The component's constructor.
   * @constructor
   *
   * @param {{schema: String, listing: Object, selected: Boolean, updateListing: Function, removeListing: Function, selectListing: Function, queryForExisting: Function}} props
   */
  constructor(props) {
    super(props);

    this.state = {editable: false, writeStatus: '', listingName: this.props.listing.name, matchingLiveListing: null};

    this.checkWriteStatus = this.checkWriteStatus.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  /**
   * Runs once the component mounts. Checks the publish/write status of the listing.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
    this.props.queryForExact(this.props.listing).then(result => {
      this.setState({matchingLiveListing: result.data[0]});
    });
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
    const listing = this.props.listing;

    this.props.queryForExisting(listing).then(message => {
      let writeStatus;

      if (!message.total) {
        writeStatus = 'new';
      } else {
        const uuids = message.data.map(row => row.uuid);
        if (uuids.includes(listing.uuid)) {
          writeStatus = 'update';
        } else {
          writeStatus = 'duplicate';
        }
      }

      this.setState({writeStatus});
    }, err => {
      console.log('error checking write status', JSON.stringify(err));
    });
  }

  /**
   * Marks the row as editable to trigger a UI change.
   * @param {Event} e
   */
  startEdit(e) {
    e.stopPropagation();
    this.setState({editable: true});
  }

  /**
   * Marks the row as not editable to trigger a UI change.
   * @param {Event} e
   */
  cancelEdit(e) {
    e.stopPropagation();
    this.setState({editable: false});
  }

  /**
   * Handles input changes by saving the data to the component's state.
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name) return;

    this.setState({[e.target.name]: e.target.value});
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the listing.
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {name: this.state.listingName};

    this.props.updateListing(this.props.listing, newData).then(() => {
      this.checkWriteStatus();
      this.setState({editable: false});
    });
  }

  /**
   * Handles the delete button click by triggering a function to delete the listing.
   * @param {Event} e
   */
  handleDeleteClick(e) {
    e.stopPropagation();
    this.props.removeListing(this.props.listing);
  }

  /**
   * Handles the row click by marking the listing as selected and triggering a handler function.
   */
  handleRowClick() {
    const selected = !this.props.selected;
    /** @var {Function} this.props.selectListing */
    this.props.selectListing(this.props.listing.id, selected);
  }

  /**
   * Renders the component.
   * @note The render has two different paths depending on whether the row can be edited.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const listingID = this.props.listing.id;
    const listingName = this.state.listingName;
    const createdAt = Moment(this.props.listing.created_at).calendar();
    const writeStatus = this.state.writeStatus;
    const selectClass = this.props.selected ? ' is-selected' : '';

    const listingParams = ['name'];

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={listingName} onChange={this.handleInputChange}
                     onClick={e => e.stopPropagation()} /></td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
        </tr>
      );
    }

    const classNameMap = this.state.matchingLiveListing ? diffListings(this.state.matchingLiveListing, this.props.listing, listingParams) : {};

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td className={classNameMap['name']}><Link to={`/pending${schema}/${listingID}`}>{listingName}</Link></td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
      </tr>
    );
  }
};
