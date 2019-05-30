import React, {Component} from 'react';

import "../../styles/filters.css";

/**
 * Filters renders filter buttons for event tables.
 *
 * @class
 */
export default class Filters extends Component {
  constructor(props) {
    // TODO: Get initial state from props
    super(props);

    this.handleButtonClick = this.handleButtonClick.bind(this);
  }

  /**
   * Runs when a filter button is clicked. Handles label changes.
   * @param {Event} e
   */
  handleButtonClick(e) {
    const filterLabel = e.target.dataset.filterType || null;
    if (!filterLabel) return;
    this.props.updateFilter((filterLabel === this.props.filterType) ? 'none' : filterLabel);
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
    const activeClass = isActive ? 'button-primary' : 'default';
    return <button
      key={`${type}-${isActive}`} type={'button'} data-filter-type={type} className={activeClass}
      onClick={this.handleButtonClick}>{text}</button>
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const currentFilter = this.props.filterType;
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
