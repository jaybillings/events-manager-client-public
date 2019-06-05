import React, {Component} from 'react';
import {MdCancel} from "react-icons/md";

import '../../styles/searchbar.css';

/**
 * `Searchbar` displays an input for text search within data tables.
 *
 * @class
 * @param {{searchTerm: String, updateSearchQuery: Function}}
 */
export default class Searchbar extends Component {
  constructor(props) {
    super(props);

    this.state = {searchTerm: ''};

    this.handleTermChange = this.handleTermChange.bind(this);
    this.handleTermClear = this.handleTermClear.bind(this);
    this.renderClearButton = this.renderClearButton.bind(this);
  }

  /**
   * `handleTermChange` is a handler for the input change event. It triggers a function to update
   * the search query.
   *
   * @param {Event} e
   */
  handleTermChange(e) {
    // TODO: Delay slightly before generating search
    const searchTerm = e.target ? e.target.value : this.state.searchTerm;

    this.setState({showCancel: !searchTerm});
    this.props.updateSearchQuery(searchTerm);
  }

  /**
   * `handleTermClear` is a handler for the clear button. It triggers a function that
   * clears the search query.
   */
  handleTermClear() {
    this.props.updateSearchQuery('');
  }

  /**
   * `renderClearButton` renders the clear button when there is content in the
   * input.
   *
   * @returns {*}
   */
  renderClearButton() {
    if (this.props.searchTerm !== '') return <span onClick={this.handleTermClear}><MdCancel /></span>;
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    return (
      <div className={'searchbar'}>
        <input
          type={'text'} placeholder={'Type here to search'} onChange={this.handleTermChange}
          value={this.props.searchTerm} />
        {this.renderClearButton()}
      </div>
    );
  }
};
