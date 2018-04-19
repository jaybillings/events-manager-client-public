import React, {Component} from 'react';

import '../../styles/add-forms.css';

export default class EventAddForm extends Component {
  render() {
    return (
      <form id={'event-add-form'}>
        <label>
          Name
          <input type={'text'} name={'nameInput'} ref={'nameInput'}/>
        </label>
        <label>
          Description
          <textarea name={'descInput'} ref={'descInput'} />
        </label>
        <label>
          Start Date
          <input type={'date'} name={'startDateInput'} ref={'startDateInput'}/>
        </label>
        <label>
          End Date
          <input type={'date'} name={'endDateInput'} ref={'endDateInput'}/>
        </label>
        <button type={'button'}>Start Over</button>
        <button type={'submit'} className={'button-primary'}>Add Event</button>
      </form>
    );
  }
};
