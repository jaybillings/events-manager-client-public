import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class OrganizerAddForm extends Component {
  constructor(props) {
    super(props);

    this.orgsService = app.service('organizers');

    this.createOrg = this.createOrg.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  createOrg(e) {
    e.preventDefault();

    const orgObj = {
      name: this.refs.nameInput.value.trim(),
      description: this.refs.descInput.value.trim()
    };

    this.orgsService.create(orgObj).then(message => {
      console.log('create', message);
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });

    this.clearForm();
  }

  clearForm() {
    this.refs.nameInput.value = '';
    this.refs.descInput.value = '';
  }

  render() {
    return (
      <form id={'org-add-form'} className={'add-form'} onSubmit={this.createOrg}>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <label>
          Description
          <textarea ref={'descInput'} required maxLength={500} />
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Start Over</button>
          <button type={'submit'} className={'button-primary'}>Add Organizer</button>
        </div>
      </form>
    );
  }
};
