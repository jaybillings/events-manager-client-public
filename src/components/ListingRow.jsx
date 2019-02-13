import React, {Component} from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import app from '../services/socketio';

import "../styles/schema-row.css";

/**
 * ListingRow is a generic component which displays a single row from a live listings table.
 * @class
 * @parent
 */
export default class ListingRow extends Component {
  /**
   * The component's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.state = {editable: false, listingName: this.props.listing.name, pendingID: ''};

    this.user = app.get('user');

    this.listingHasPending = this.listingHasPending.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
  }

  /**
   * Runs when the component mounts. Fetches data necessary for view.
   * @override
   */
  componentDidMount() {
    this.listingHasPending();
  }

  /**
   * Checks for the presence pending listings that duplicate the listing (have the same UUID).
   */
  listingHasPending() {
    this.props.checkForPending(this.props.listing.uuid).then(message => {
      this.setState({pendingID: message.data[0].id});
    }, err => {
      console.log("Error fetching pending listings: ", JSON.stringify(err));
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
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  /**
   * Handles the save button click by parsing new data and triggering a function to update the listing.
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {uuid: this.props.listing.uuid, name: this.state.listingName};

    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.setState({editable: false});
    });
  }

  /**
   * Handles the copy button click by triggering a function to create a pending listing that duplicates the listing.
   */
  handleCopyClick(e) {
    e.stopPropagation();

    let {id, ...listingData} = this.props.listing;

    listingData.created_at = Moment(listingData.created_at).valueOf();
    listingData.updated_at = Moment(listingData.updated_at).valueOf();

    this.props.createPendingListing(id, listingData).then(() => {
      this.listingHasPending();
    });
  }

  /**
   * Handles the delete button click by triggering a function to delete the listing.
   */
  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  /**
   * Renders the edit button. Can also be a copy button or a link to a pending listing that duplicates the listing.
   * @returns {*}
   */
  renderEditButton() {
    if (this.user.is_su) {
      return <button type={'button'} onClick={this.startEdit}>Edit</button>;
    } else if (this.state.pendingID) {
      return <Link to={`/pending${this.props.schema}/${this.state.pendingID}`} className={'button'}>Edit Pending
        Copy</Link>;
    } else {
      return <button type={'button'} onClick={this.handleCopyClick}>Copy For Editing</button>
    }
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
    const id = this.props.listing.id;
    const name = this.state.listingName;
    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    const deleteButton = this.user.is_admin
      ? <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button> : '';

    return (
      <tr className={'schema-row'}>
        <td>
          {this.renderEditButton()}
          {deleteButton}
        </td>
        <td><Link to={`/${schema}/${id}`}>{name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
