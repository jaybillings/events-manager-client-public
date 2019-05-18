import React, {Component} from 'react';
import {MdCancel} from "react-icons/md";

import '../../styles/searchbar.css';

/**
 * The Searchbar component displays an input for searching within tables.
 * @class
 */
export default class Searchbar extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{updateFilter: Function}} props
   */
  constructor(props) {
    super(props);

    this.state = {searchTerm: ''};

    this.handleTermChange = this.handleTermChange.bind(this);
    this.handleTermClear = this.handleTermClear.bind(this);
    this.renderClearButton = this.renderClearButton.bind(this);
  }

  handleTermChange(e) {
    // TODO: Delay slightly before generating search (?)
    const searchTerm = e.target ? e.target.value : this.state.searchTerm;

    this.setState({showCancel: !searchTerm});
    this.props.updateSearchQuery(searchTerm);
  }

  handleTermClear() {
    this.props.updateSearchQuery('');
  }

  renderClearButton() {
    if (this.props.searchTerm !== '') return <span onClick={this.handleTermClear}><MdCancel /></span>;
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
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
