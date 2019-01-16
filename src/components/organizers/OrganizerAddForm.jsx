import React from 'react';
import ListingAddForm from "../ListingAddForm";

/**
 * OrganizerAddForm is a component that displays a form for adding new organizers.
 *
 * @class
 * @child
 */
export default class OrganizerAddForm extends ListingAddForm {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.phoneInput = React.createRef();
    this.urlInput = React.createRef();
    this.descInput = React.createRef();
  }

  /**
   * Handles the submit event by parsing data and calling a function to create a new event.
   *
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const listingObj = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    this.phoneInput.current.value !== '' && (listingObj.phone = this.phoneInput.current.value.trim());
    this.urlInput.current.value !== '' && (listingObj.url = this.urlInput.current.value.trim());

    this.props.createListing(listingObj).then(() => this.clearForm());
  }

  /**
   * Clears the form by setting all values to their empty value.
   */
  clearForm() {
    this.nameInput.current.value = '';
    this.phoneInput.current.value = '';
    this.urlInput.current.value = '';
    this.descInput.current.value = '';
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    return (
      <form id={'organizers-add-form'} className={'add-form'} onSubmit={this.handleSubmit}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={this.descInput} required maxLength={500} />
        </label>
        <label>
          URL
          <input type={'url'} ref={this.urlInput} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>Add Organizer</button>
        </div>
      </form>
    );
  }
};
