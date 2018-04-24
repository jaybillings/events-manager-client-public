import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-forms.css';

export default class EventAddForm extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    // Set date picker's default
    this.refs.startInput.valueAsDate = new Date();
    this.refs.endInput.valueAsDate = new Date();

    app.service('events').on('created', (message) => console.log('created', message));
  }

  handleSubmit(e) {
    e.preventDefault();

    const eventObj = {
      name: this.refs.nameInput.value.trim(),
      description: this.refs.descInput.value.trim(),
      start_date: this.refs.startInput.value.trim(),
      end_date: this.refs.endInput.value.trim()
    };

    // Submit data
    app.service('events').create(eventObj).then(
      function () {
        console.log('Event successfully saved');
      },
      function (reason) {
        console.log('Event not saved: ', Object.values(reason).join(''));
      });

    // Clear form
    this.refs.nameInput.value = '';
    this.refs.descInput.value = '';
    this.refs.startInput.value = '';
    this.refs.endInput.value = '';
  }

  render() {
    return (
      <form id={'event-add-form'} onSubmit={this.handleSubmit}>
        <label className={'required'}>
          Name
          <input type={'text'} ref={'nameInput'} required maxLength="100"/>
        </label>
        <label className={'required'}>
          Start Date
          <input type={'date'} ref={'startInput'} required />
        </label>
        <label className={'required'}>
          End Date
          <input type={'date'} ref={'endInput'} required />
        </label>
        <label className={'required'}>
          Description
          <textarea ref={'descInput'} required maxLength="500" />
        </label>
        <button type={'button'}>Start Over</button>
        <button type={'submit'} className={'button-primary'}>Add Event</button>
      </form>
    );
  }
};
