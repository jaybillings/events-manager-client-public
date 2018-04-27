import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class NeighborhoodAddForm extends Component {
  constructor(props) {
    super(props);

    this.hoodsService = app.service('neighborhoods');

    this.createHood = this.createHood.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  createHood(e) {
    e.preventDefault();

    const hoodObj = {name: this.refs.nameInput.value.trim()};

    this.hoodsService.create(hoodObj).then(message => {
      console.log('crete', message);
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });

    this.clearForm();
  }

  clearForm() {
    this.refs.nameInput.value = '';
  }

  render() {
    return (
      <form id={'hood-add-form'} className={'add-form'} onSubmit={this.createHood}>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100}/>
        </label>
        <div>
          <button type={'button'} onClick={this.clearForm}>Start Over</button>
          <button type={'submit'} className={'button-primary'}>Add Neighborhood</button>
        </div>
      </form>
    );
  }
};
