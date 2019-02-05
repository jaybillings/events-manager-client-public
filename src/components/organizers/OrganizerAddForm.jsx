import React from 'react';
import ListingAddForm from "../ListingAddForm";

/**
 * OrganizerAddForm is a component which displays a form for adding new organizers.
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
   * Compiles the data required for creating a new listing from the form fields.
   *
   * @returns {{name: string, description: string}}
   */
  buildNewListing() {
    const orgObj = {
      name: this.nameInput.current.value,
      description: this.descInput.current.value
    };

    this.phoneInput.current.value !== '' && (orgObj.phone = this.phoneInput.current.value);
    this.urlInput.current.value !== '' && (orgObj.url = this.urlInput.current.value);

    return orgObj;
  }

  /**
   * Clears the form by setting all values to their empty value.
   * @override
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
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const submitAction = this.user.is_admin ? this.handleAddClick : this.handleAddPendingClick;
    const submitLabel = this.user.is_admin ? 'Publish Organizer' : 'Add Pending Organizer';

    return (
      <form id={'organizers-add-form'} className={'add-form'} action={submitAction}>
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
          <button type={'button'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
