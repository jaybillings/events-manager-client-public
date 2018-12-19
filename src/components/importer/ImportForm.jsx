import React, {Component} from 'react';

import '../../styles/import-form.css';

/**
 * The ImportForm component displays a form used for importing external data.
 * @class
 */
export default class ImportForm extends Component {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param props
   */
  constructor(props) {
    super(props);

    this.renderSchemaSelect = this.renderSchemaSelect.bind(this);
  }

  /**
   * Renders the schema selection dropdown.
   *
   * @returns {*}
   */
  renderSchemaSelect() {
    const schemas = ['events', 'venues', 'organizers', 'neighborhoods', 'tags'];
    let selectOptions = [];

    schemas.forEach((schema) => {
      selectOptions.push(<option key={schema} value={schema}>{schema}</option>);
    });

    return (
      <select id={'schema-select'} ref={this.props.schemaSelectRef} required>
        {selectOptions}
      </select>
    );
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    return (
      <form id={'import-from-csv-form'} className={'import-form'} onSubmit={this.props.handleSubmit}>
        <div>
          <label htmlFor="fileInput">Select CSV file to import:</label>
          <input type={'file'} ref={this.props.fileInputRef} id={'fileInput'} accept={".csv"} multiple required />
        </div>
        <div>
          <label htmlFor={'schema-select'}>Select a schema to update:</label>
          {this.renderSchemaSelect()}
        </div>
        <button type={'submit'}>Import Data From File</button>
      </form>
    );
  }
};
