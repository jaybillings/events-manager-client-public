import React from 'react';
import ListingAddForm from "../ListingAddForm";

export default class OrganizerAddForm extends ListingAddForm {
  constructor(props) {
    super(props);

    this.phoneInput = React.createRef();
    this.urlInput = React.createRef();
    this.descInput = React.createRef();
  }

  handleSubmit(e) {
    e.preventDefault();

    const listingObj = {
      name: this.nameInput.current.value.trim(),
      description: this.descInput.current.value.trim()
    };

    this.phoneInput.current.value !== '' && (listingObj.phone = this.phoneInput.current.value.trim());
    this.urlInput.current.value !== '' && (listingObj.url = this.urlInput.current.value.trim());

    console.log(listingObj);

    this.props.createListing(listingObj);
    this.clearForm();
  }

  clearForm() {
    this.nameInput.current.value = '';
    this.phoneInput.current.value = '';
    this.urlInput.current.value = '';
    this.descInput.current.value = '';
  }

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
