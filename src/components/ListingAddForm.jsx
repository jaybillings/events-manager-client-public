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
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.user = app.get('user');

    this.nameInput = React.createRef();

    this.handleAddClick = this.handleAddClick.bind(this);
    this.handleAddPendingClick = this.handleAddPendingClick.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  /**
   * Handles the submit event by parsing data and calling a function to create a new listing.
   */
  handleAddClick() {
    this.props.createListing(this.buildNewListing()).then(() => this.clearForm());
  }

  handleAddPendingClick() {
    this.props.createPendingListing(this.buildNewListing()).then(() => {
      this.clearForm()
    });
  }

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
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const addButton = this.user.is_admin
      ? <button type={'button'} onClick={this.handleAddClick}>Publish {makeSingular(schema)}</button>
      : <button type={'button'} onClick={this.handleAddPendingClick}>Add Pending {makeSingular(schema)}</button>;

    return (
      <form id={`${schema}-add-form`} className={'add-form'}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          {addButton}
        </div>
      </form>
    );
  }
};
