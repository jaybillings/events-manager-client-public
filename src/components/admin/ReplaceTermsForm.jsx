import React, {Component} from 'react';
import {makeSingular, renderOptionList} from "../../utilities";

export default class ReplaceTermsForm extends Component {
  constructor(props) {
    super(props);

    this.state = {nameToReplace: '', uuidOfReplacement: ''};

    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.doReplacement(this.state.nameToReplace, this.state.uuidOfReplacement);
  }

  render() {
    const schema = this.props.schema;
    const schemaSingular = makeSingular(schema);
    const uniqueListings = this.props.uniqueListings;
    const liveListings = this.props.liveListings;
    const nameToReplace = this.state.nameToReplace;
    const uuidOfReplacement = this.state.uuidOfReplacement;

    return (
      <form id={`${schema}-replace-form`} className={'add-form'} onSubmit={this.handleSubmit}>
        <h3>Replace {schema}</h3>
        <label>
          <span>Replace all {schema} (pending and live) named this:</span>
          <select name={'nameToReplace'} value={nameToReplace} onChange={this.handleListSelect}>
            {renderOptionList(uniqueListings, schema, 'name')}
          </select>
        </label>
        <label>
          <span>With this {schemaSingular} listing:</span>
          <select name={'uuidOfReplacement'} value={uuidOfReplacement} onChange={this.handleListSelect}>
            {renderOptionList(liveListings, schema)}
          </select>
        </label>
        <button type={'submit'} className={'emphasize'}>Replace and Delete {schema}</button>
      </form>
    );
  }
};
