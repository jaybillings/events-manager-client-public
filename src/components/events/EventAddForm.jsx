import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-forms.css';

export default class EventAddForm extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    app.service('events').on('created', (message) => console.log('created', message));
  }

  handleSubmit(e) {
    e.preventDefault();

    const eventObj = {
      name: this.refs.nameInput.value.trim(),
      description: this.refs.descInput.value.trim(),
      start_date: this.refs.startDateInput.value.trim(),
      end_date: this.refs.endDateInput.value.trim()
    };

    // Submit data
    app.service('events').create(eventObj).then(
      function () {
        console.log('Event successfully saved');
      },
      function (reason) {
        console.log('Event not saved: ', reason);
      });

    // Clear form
    this.refs.nameInput.value = '';
    this.refs.descInput.value = '';
    this.refs.startDateInput.value = '';
    this.refs.endDateInput.value = '';
  }

  render() {
    return (
      <form id={'event-add-form'} onSubmit={this.handleSubmit}>
        <label>
          Name
          <input type={'text'} name={'nameInput'} ref={'nameInput'}/>
        </label>
        <label>
          Start Date
          <input type={'date'} name={'startDateInput'} ref={'startDateInput'}/>
        </label>
        <label>
          End Date
          <input type={'date'} name={'endDateInput'} ref={'endDateInput'}/>
        </label>
        <label>
          Description
          <textarea name={'descInput'} ref={'descInput'}/>
        </label>
        <button type={'button'}>Start Over</button>
        <button type={'submit'} className={'button-primary'}>Add Event</button>
      </form>
    );
  }
};
