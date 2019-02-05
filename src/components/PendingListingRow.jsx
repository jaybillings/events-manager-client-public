import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from "react-router-dom";

import StatusLabel from "./common/StatusLabel";

import "../styles/schema-row.css";

/**
 * PendingListingRow is a generic component that displays a single row from a pending listings table.
 * @class
 * @parent
 */
export default class PendingListingRow extends Component {
  /**
   * The component's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.state = {editable: false, writeStatus: ''};

    this.nameInput = React.createRef();

    this.checkWriteStatus = this.checkWriteStatus.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  /**
   * Runs once the component mounts. Checks the publish/write status of the listing.
   * @override
   */
  componentDidMount() {
    this.checkWriteStatus();
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
    this.props.queryForExisting(this.props.listing).then(message => {
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
   * Handles the save button click by parsing new data and triggering a function to update the listing.
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    this.props.updateListing(this.props.listing.id, {name: this.nameInput.current.value}).then(() => {
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
    this.props.removeListing(this.props.listing.id);
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
    const pendingListing = this.props.listing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const writeStatus = this.state.writeStatus;
    const selectClass = selected ? ' is-selected' : '';
    const schema = this.props.schema;

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} /></td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
        </tr>
      );
    }

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pending${schema}/${pendingListing.id}`}>{pendingListing.name}</Link></td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
      </tr>
    );
  }
};
