import React from 'react';
import ListingAddForm from "../ListingAddForm";

/**
 * `OrganizerAddForm` displays a form for adding new organizers.
 *
 * @class
 * @child
 * @param {{schema: String, listings: Object, createListing: Function, createPendingListing: Function}} props
 */
export default class OrganizerAddForm extends ListingAddForm {
  constructor(props) {
    super(props);

    this.phoneInput = React.createRef();
    this.urlInput = React.createRef();
    this.descInput = React.createRef();
  }

  /**
   * `buildNewListing` compiles data for creating a new listing.
   *
   * @override
   * @returns {*}
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
   * `clearForm` clears the add form by resetting the input values.
   *
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
      <form id={'organizers-add-form'} className={'add-form'} onSubmit={submitAction}>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
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
          <input type={'text'} ref={this.urlInput} />
        </label>
        <label>
          Phone Number
          <input type={'tel'} ref={this.phoneInput} />
        </label>
        <div>
          <button type={'button'} className={'default'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>{submitLabel}</button>
        </div>
      </form>
    );
  }
};
