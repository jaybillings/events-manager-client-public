import React, {Component} from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {printToConsole} from "../utilities";
import app from '../services/socketio';

import "../styles/schema-row.css";

/**
 * `ListingRow` displays a single row from a live listings table.
 *
 * @class
 * @parent
 */
export default class ListingRow extends Component {
  /**
   * The component's constructor.
   *
   * @constructor
   * @param {{schema: String, listing: Object, updateListing: Function, deleteListing: Function, createPendingListing: Function, queryForMatching: Function}} props
   */
  constructor(props) {
    super(props);

    this.state = {editable: false, listingName: this.props.listing.name, pendingListing: {}};

    this.user = app.get('user');

    this.listingHasPending = this.listingHasPending.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During`componentDidMount`, the component restores the table state,
   * fetches all data, and registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    this.listingHasPending();
  }

  /**
   * `listingHasPending` queries for a pending listing that duplicates the live listing (matching UUID).
   */
  listingHasPending() {
    this.props.queryForMatching(this.props.listing.uuid)
      .then(message => {
        if (message.total) this.setState({matchingPendingListing: message.data[0]});
      })
      .catch(err => {
        printToConsole(err);
      });
  }

  /**
   * `startEdit` marks the row as editable.
   *
   * @param {Event} e
   */
  startEdit(e) {
    e.stopPropagation();
    this.setState({editable: true});
  }

  /**
   * `cancelEdit` marks the row as not editable.
   *
   * @param {Event} e
   */
  cancelEdit(e) {
    e.stopPropagation();
    this.setState({editable: false});
  }

  /**
   * `handleInputChange` handles input changes by saving the data to the component's state.
   *
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name || !e.target.value) return;
    this.setState({[e.target.name]: e.target.value});
  }

  /**
   * `handleSaveClick` runs when the save button is clicked. It initiates the saving of the row's data.
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {name: this.state.listingName};

    this.props.updateListing(this.props.listing, newData).then(() => {
      this.setState({editable: false});
    });
  }

  /**
   * `handleCopyClick` runs whn the copy button is clicked. It initiates the creation of a pending
   * listing from the published listing's data.
   *
   * @param {Event} e
   */
  handleCopyClick(e) {
    e.stopPropagation();

    // noinspection JSUnusedLocalSymbols
    let {id, ...listingData} = this.props.listing;

    listingData.created_at = Moment(listingData.created_at);
    listingData.updated_at = Moment(listingData.updated_at);

    this.props.createPendingListing(listingData).then(result => {
      this.setState({matchingPendingListing: result});
    });
  }

  /**
   * `handleDeleteClick` runs when the delete button is clicked. It initiates the deletion of the
   * pending listing.
   *
   * @param {Event} e
   */
  handleDeleteClick(e) {
    e.stopPropagation();
    this.props.deleteListing(this.props.listing);
  }

  /**
   * `renderEditButton` renders the edit button.
   *
   * Depending on the user state, this either allows for editing the row or initiates the creation of a new, matching
   * pending listing that can be edited.
   *
   * @returns {*}
   */
  renderEditButton() {
    if (this.user.is_su) return <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>;

    if (this.state.matchingPendingListing) return <Link to={`/pending${this.props.schema}/${this.state.pendingID}`}
                                                        className={'button emphasize'}>Edit Pending Copy</Link>;

    return <button type={'button'} className={'emphasize'} onClick={this.handleCopyClick}>Copy For Editing</button>
  }

  /**
   * Renders the component.
   *
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
            <button type={'button'} className={'emphasize more'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange} /></td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    const deleteButton = this.user.is_su
      ? <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete forever</button> : '';

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
