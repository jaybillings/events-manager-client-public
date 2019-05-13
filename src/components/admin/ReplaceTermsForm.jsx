import React, {Component} from 'react';
import {makeSingular, renderOptionList} from "../../utilities";

export default class ReplaceTermsForm extends Component {
  constructor(props) {
    super(props);

    this.toReplaceRef = React.createRef();
    this.replaceWithRef = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    //TODO: DO everything except making the new lookup row?
    this.props.runTagReplacement(this.toReplaceRef.current.value, this.replaceWithRef.current.value);
  }

  render() {
    const schema = this.props.schema;
    const schemaSingular = makeSingular(schema);
    const uniqueListings = this.props.uniqueListings;
    const liveListings = this.props.liveListings;

    return (
      <form id={`${schema}-replace-form`} className={'add-form'} onSubmit={this.handleSubmit}>
        <label>
          <span>Replace all {schema} (pending and live) named this:</span>
          <select ref={this.toReplaceRef} name={'nameToReplace'} defaultValue={''}>
            {renderOptionList(uniqueListings, schema, 'name')}
          </select>
        </label>
        <label>
          <span>With this {schemaSingular} listing:</span>
          <select ref={this.replaceWithRef} name={'uuidOfReplacement'} defaultValue={''}>
            {renderOptionList(liveListings, schema)}
          </select>
        </label>
        <button type={'submit'} className={'emphasize'}>Replace and Delete {schema}</button>
      </form>
    );
  }
};