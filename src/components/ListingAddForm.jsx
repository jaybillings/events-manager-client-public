import React, {Component} from 'react';
import {makeTitleCase} from "../utilities";

import '../styles/add-form.css';

/**
 * ListingAddForm is a generic component that displays a form for adding new listings.
 *
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

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  /**
   * Handles the submit event by parsing data and calling a function to create a new listing.
   *
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const listingObj = {name: this.nameInput.current.value};

    this.props.createListing(listingObj).then(() => this.clearForm());
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
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const titleCaseSchema = makeTitleCase(schema);

    return (
      <form id={`${schema}-add-form`} className={'add-form'} onSubmit={this.handleSubmit}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>Add {titleCaseSchema.slice(0, -1)}</button>
        </div>
      </form>
    );
  }
};
