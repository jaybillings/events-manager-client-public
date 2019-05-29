import React, {Component} from 'react';
import {BeatLoader} from 'react-spinners';

import '../../styles/import-form.css';

/**
 * @param {{fileInputRef: Object, handleImportClick: Function}} props
 */
export default class ImportXMLForm extends Component {
  render() {
    const spinnerClass = this.props.importRunning ? ' button-with-spinner' : '';

    return (
      <div className={'schema-module'}>
        <form id={'form-import-xml'} className={'import-form'} onSubmit={this.props.handleImportClick}>
          <div>
            <label htmlFor={'fileInput'}>Select file to import:</label>
            <input type={'file'} ref={this.props.fileInputRef} id={'fileInput'} accept={".xml"} multiple required />
          </div>
          <div>
            <button type={'submit'} className={`button-primary${spinnerClass}`}>
              import data from file
              <BeatLoader size={8} sizeUnit={"px"} color={'#c2edfa'} loading={this.props.importRunning} />
            </button>
          </div>
        </form>
      </div>
    );
  }
};
