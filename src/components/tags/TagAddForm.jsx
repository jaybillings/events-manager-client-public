import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class TagAddForm extends Component {
  constructor(props) {
    super(props);

    this.tagsService = app.service('tags');

    this.createHood = this.createHood.bind(this);
  }

  createHood(e) {
    e.preventDefault();

    const tagObj = {name: this.refs['nameInput'].value.trim()};

    this.tagsService.create(tagObj).then(message => {
      console.log('create', message);
      document.querySelector('#tag-add-form').reset();
    }, reason => {
      console.log('error', Object.values(reason).join(''));
    });
  }

  render() {
    return (
      <form id={'tag-add-form'} className={'add-form'} onSubmit={this.createHood}>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength={100} />
        </label>
        <button type={'submit'} className={'button-primary'}>Add Tag</button>
      </form>
    );
  }
};
