import React, {Component} from 'react';

export default class ImportForm extends Component {
  render() {
    return (
      <form id={'import-from-csv-form'} className={'import-form'} onSubmit={this.props.handleSubmit}>
        <label htmlFor="fileInput">Select CSV file to import:</label>
        <input type={'file'} ref={this.props.fileInputRef} id={'fileInput'} accept={".csv"} multiple required />
        <button type={'submit'} className={'button-primary'}>Import Data From File</button>
      </form>
    );
  }
};
