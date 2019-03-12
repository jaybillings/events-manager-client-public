import React, {Component} from 'react';
import app from "../services/socketio";
import {makeSingular} from "../utilities";

import '../styles/add-form.css';

/**
 * ListingAddForm is a generic component which displays a form for adding new listings.
 * @parent
 * @class
 */
export default class ListingAddForm extends Component {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {{schema: String, createListing: Function, createPendingListing: Function}} props
   */
  constructor(props) {
    super(props);

    this.user = app.get('user');

    this.nameInput = React.createRef();

    this.handleAddClick = this.handleAddClick.bind(this);
    this.handleAddPendingClick = this.handleAddPendingClick.bind(this);
    this.buildNewListing = this.buildNewListing.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  /**
   * Handles the submit action by triggering the creation of a new listing.
   * @param {Event} e
   */
  handleAddClick(e) {
    e.preventDefault();
    const listingData = this.buildNewListing();
    this.props.createListing(listingData);
  }

  /**
   * Handles the submit action by triggering the creation of a new pending listing.
   *
   * @param {Event} e
   */
  handleAddPendingClick(e) {
    e.preventDefault();
    const listingData = this.buildNewListing();
    this.props.createPendingListing(listingData);
  }

  /**
   * Compiles the data required for building a new listing.
   *
   * @returns {*}
   */
  buildNewListing() {
    return {name: this.nameInput.current.value};
  }

  /**
   * Clears the form by setting its value to an empty string.
   */
  clearForm() {
    this.nameInput.current.value = '';
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const submitAction = this.user.is_admin ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_admin ? `Publish ${makeSingular(schema)}` : `Add Pending ${makeSingular(schema)}`;

    return (
      <form id={`${schema}-add-form`} className={'add-form'} onSubmit={submitAction}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
