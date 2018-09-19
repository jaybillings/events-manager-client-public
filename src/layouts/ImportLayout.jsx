import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import ImportForm from '../components/importer/ImportForm';

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.importerService = app.service('importer');
    this.fileInput = React.createRef();

    this.importData = this.importData.bind(this);
  }

  componentDidMount() {
    // Register listeners
    this.importerService
      .on('created', (message) => {
        console.log('created ', message);
      })
      .on('updated', message => {
        console.log('updated ', message);
      });
  }

  componentWillUnmount() {
    this.importerService
      .removeListener('created')
      .removeListener('updated');
  }

  importData(e) {
    // TODO: Handle multiple files
    e.preventDefault();
    console.log('in importdata');
    //const fileToImport = this.fileInput.current.files[0];
    let importData = new FormData();
    importData.append('file', this.fileInput.current.files[0]);
    importData.append('filename', this.fileInput.current.files[0].name);

    fetch('http://localhost:3030/importer', {
      method: 'POST',
      body: importData
    }).then((response) => {
      response.json().then((body) => {
        console.log(body);
      });
    });
  }

  render() {
    return (
      <div className="container">
        <Header />
        <h2>Import</h2>
        <h3>Import Data From File</h3>
        <ImportForm fileInputRef={this.fileInput} handleSubmit={this.importData} />
        <h3>Review Unpublished Data</h3>
        <h3>Publish</h3>
      </div>
    );
  }
};
