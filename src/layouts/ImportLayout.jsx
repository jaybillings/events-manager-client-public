import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.importerService = app.service('importer');

    this.importData = this.importData.bind(this);
  }

  importData(e) {
    e.preventDefault();

    // TODO: Make a post to service w/ file data
  }

  render() {
    return (
      <div className="container">
        <Header />
        <h2>Import</h2>
        <h3>Import Data From File</h3>
          <form id={'import-from-csv-form'} className={'import-form'} onSubmit={this.importData}>
            <label htmlFor="fileInput">Select file to import:</label>
            <input type={'file'} ref={'fileInput'} id={'fileInput'} accept={".csv"} multiple required />
            <button type={'submit'} className={'button-primary'}>Import Data From File</button>
          </form>
        <h3>Review Unpublished Data</h3>
        <h3>Publish</h3>
      </div>
    );
  }
};
