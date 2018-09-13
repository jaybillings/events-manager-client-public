import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class NeighborhoodAddForm extends Component {
  constructor(props) {
    super(props);

    this.hoodsService = app.service('neighborhoods');

    this.createHood = this.createHood.bind(this);
  }

  createHood(e) {
    e.preventDefault();

    const hoodObj = {name: this.refs['nameInput'].value.trim()};

    this.hoodsService.create(hoodObj).then(message => {
      console.log('crete', message);
      document.querySelector('#hood-add-form').reset();
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });
  }

  render() {
    return (
      <form id={'hood-add-form'} className={'add-form'} onSubmit={this.createHood}>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <button type={'submit'} className={'button-primary'}>Add Neighborhood</button>
      </form>
    );
  }
};
