import React, {Component} from 'react';
import {makeTitleCase} from "../utilities";

import '../styles/add-form.css';

export default class ListingAddForm extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const listingObj = {name: this.nameInput.current.value.trim()};

    this.props.createListing(listingObj).then(() => this.clearForm());
  }

  clearForm() {
    this.nameInput.current.value = '';
  }

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
