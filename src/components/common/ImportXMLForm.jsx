import React, {Component} from 'react';

import '../../styles/import-form.css';

/**
 * @param {{fileInputRef: Object, handleImportClick: Function}} props
 */
export default class ImportXMLForm extends Component {
  render() {
    return (
      <form id={'form-import-xml'} className={'import-form'} onSubmit={this.props.handleImportClick}>
        <div>
          <label htmlFor={'fileInput'}>Select BeDynamic file to import:</label>
          <input type={'file'} ref={this.props.fileInputRef} id={'fileInput'} accept={".xml"} multiple required />
        </div>
        <div>
          <button type={'submit'} className={'button-primary'}>import data from file</button>
        </div>
      </form>
    );
  }
};
