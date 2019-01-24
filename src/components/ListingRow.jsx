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

    this.state = {editable: false, listingName: this.props.listing.name};
    this.user = app.get('user');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
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
   * Handles changes to input blocks by saving the data as a state parameter.
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
   * Handles the delete button click by triggering a function to delete the listing.
   */
  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
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
      ? <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button>: '';

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          {deleteButton}
        </td>
        <td><Link to={`/${schema}/${id}`}>{name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
