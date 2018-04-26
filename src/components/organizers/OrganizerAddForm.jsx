import React, {Component} from 'react';
import app from '../../services/socketio';

import '../../styles/add-form.css';

export default class OrganizerAddForm extends Component {
  constructor(props) {
    super(props);

    this.orgsService = app.service('organizers');

    this.createEvent = this.createEvent.bind(this);
  }
  
  render() {
    return (

    );
  }
};
