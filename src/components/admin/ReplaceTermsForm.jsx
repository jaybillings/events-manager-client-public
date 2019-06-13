import React, {Component} from 'react';
import {makeSingular, renderOptionList} from "../../utilities";
import {BeatLoader} from "react-spinners";

/**
 * `ReplaceTermsForm` displays the form for replacing listings.
 */
export default class ReplaceTermsForm extends Component {
  constructor(props) {
    super(props);

    this.toReplaceRef = React.createRef();
    this.replaceWithRef = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * `handleSubmit` runs on submit. It triggers the term replacement.
   * @param e
   */
  handleSubmit(e) {
    e.preventDefault();

    this.props.runReplacement(this.toReplaceRef.current.value, this.replaceWithRef.current.value);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const schemaSingular = makeSingular(schema);
    const uniqueListings = this.props.uniqueListings;
    const liveListings = this.props.liveListings;

    const spinnerClass = this.props.replaceRunning ? ' button-with-spinner' : '';

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
        <button type={'submit'} className={`emphasize${spinnerClass}`}>
          <BeatLoader size={8} color={'#c2edfa'} loading={this.props.replaceRunning} />
          Replace and Delete {schema}
        </button>
      </form>
    );
  }
};
