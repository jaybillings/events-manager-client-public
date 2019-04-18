import React, {Component} from 'react';

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
   * @param {{updateFilters: Function}} props
   */
  constructor(props) {
    super(props);

    this.state = {searchTerm: '', searching: false};

    this.handleSearch = this.handleSearch.bind(this);
  }

  handleSearch(e) {
    // TODO: Delay slightly before generating search
    
    console.log('in handleseearch');

    if (this.state.searching) return;

    const searchTerm = e.target ? e.target.value : this.state.searchTerm;

    this.setState({searchTerm, searching: true}, () => {
      console.log('[DEBUG]', this.state);
      // TODO: Do the actual search here
      this.setState({searching: false});
    });
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
        <input type={'text'} placeholder={'Type here to search'} onChange={this.handleSearch} />
      </div>
    );
  }
};
