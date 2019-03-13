import React, {Component} from 'react';

import "../../styles/filters.css";

/**
 * The Filters component displays filtering for event tables.
 *
 * @class
 */
export default class Filters extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{updateFilters: Function}} props
   */
  constructor(props) {
    super(props);

    this.state = {currentFilter: 'none'};

    this.handleSelection = this.handleSelection.bind(this);
  }

  /**
   * Handles filter selection by setting the current filter type.
   *
   * @param {Event} e
   */
  handleSelection(e) {
    const tmpFilter = e.target.dataset.filterType;
    const filter = (this.state.currentFilter === tmpFilter) ? 'none' : tmpFilter;

    this.setState({'currentFilter': filter});
    this.props.updateFilters(filter);
  }

  /**
   * Renders a filter button.
   *
   * @param {string} type
   * @param {string} text
   * @param {boolean} isActive
   * @returns {*}
   */
  renderButton(type, text, isActive) {
    let activeClass = isActive ? 'button-primary' : '';
    return <button key={`${type}-${isActive}`} type={'button'} data-filter-type={type} className={activeClass} onClick={this.handleSelection}>{text}</button>
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const currentFilter = this.state.currentFilter;
    let buttons = [];


    if (currentFilter === 'live') {
      buttons.push(this.renderButton('live', 'Show All', true));
    } else {
      buttons.push(this.renderButton('live', 'Show Live Only', false));
    }

    if (currentFilter === 'stale') {
      buttons.push(this.renderButton('stale', 'Show All', true));
    } else {
      buttons.push(this.renderButton('stale', 'Show Stale Only', false));
    }

    if (currentFilter === 'dropped') {
      buttons.push(this.renderButton('dropped', 'Show All', true));
    } else {
      buttons.push(this.renderButton('dropped', 'Show Dropped Only', false));
    }

    return (
      <div className={'filter-container'}>
        {buttons}
      </div>
    );
  }
};
