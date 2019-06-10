import React, {Component} from 'react';
import app from "../services/socketio";
import {makeSingular} from "../utilities";

import '../styles/add-form.css';

/**
 * `ListingAddForm` is a generic component which displays the form for adding new listings.
 *
 * @parent
 * @class
 * @param {{schema: String, createListing: Function, createPendingListing: Function}} props
 */
export default class ListingAddForm extends Component {
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
   * `handleAddClick` runs on submit. Initiates the creation of a new live listing.
   *
   * @param {Event} e
   */
  handleAddClick(e) {
    e.preventDefault();
    const listingData = this.buildNewListing();
    this.props.createListing(listingData).then(() => {
      this.clearForm();
    });
  }

  /**
   * `handleAddPendingClick` runs on submit. Initiates the creation of a new pending listing.
   *
   * @param {Event} e
   */
  handleAddPendingClick(e) {
    e.preventDefault();
    const listingData = this.buildNewListing();
    this.props.createPendingListing(listingData);
  }

  /**
   * `buildNewListing` compiles data for creating a new listing.
   *
   * @returns {*}
   */
  buildNewListing() {
    return {name: this.nameInput.current.value};
  }

  /**
   * `clearForm` clears the add form by resetting the input values.
   */
  clearForm() {
    this.nameInput.current.value = '';
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
    const submitAction = this.user.is_admin ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_admin ? `Publish ${makeSingular(schema)}` : `Add Pending ${makeSingular(schema)}`;

    return (
      <form id={`${schema}-add-form`} className={'add-form'} onSubmit={submitAction}>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
