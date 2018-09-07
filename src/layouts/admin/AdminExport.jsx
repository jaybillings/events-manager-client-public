import React, {Component} from 'react';
import app from '../../services/socketio';

export default class AdminExport extends Component {
  constructor(props) {
    super(props);

    this.eventsService = app.service('events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.exportAllData = this.exportAllData.bind(this);
  }

  fetchAllData() {
    return {};
  }

  exportAllData() {
    let dataBlob = this.fetchAllData();
  }

  render() {
    return (
      <button type={'submit'} className={'button-primary'} onClick={this.exportAllData}>Export All Data</button>
    );
  }
};
