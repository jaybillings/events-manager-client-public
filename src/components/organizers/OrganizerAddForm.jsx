import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class OrganizerAddForm extends Component {
  constructor(props) {
    super(props);

    this.orgsService = app.service('organizers');

    this.createOrg = this.createOrg.bind(this);
  }

  createOrg(e) {
    e.preventDefault();

    const orgObj = {
      name: this.refs['nameInput'].value.trim(),
      description: this.refs['descInput'].value.trim()
    };

    // Only add non-required if they have a value
    this.refs['urlInput'].value && (orgObj['url'] = this.refs['urlInput'].value);
    this.refs['phoneInput'].value && (orgObj['phone'] = this.refs['phoneInput'].value);

    this.orgsService.create(orgObj).then(message => {
      console.log('create', message);
      document.querySelector('#org-add-form').reset();
    }, reason => {
      console.log('error', JSON.stringify(reason));
    });
  }

  render() {
    return (
      <form id={'org-add-form'} className={'add-form'} onSubmit={this.createOrg}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={'descInput'} required maxLength={500} />
        </label>
        <label>
          Url
          <input type={'url'} ref={'urlInput'} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={'phoneInput'} />
        </label>
        <button type={'submit'} className={'button-primary'}>Add Organizer</button>
      </form>
    );
  }
};
