import React, {Component} from 'react';

import '../../styles/selection-control.css';

/**
 * The SelectionControl component displays a button for selecting all/no rows.
 * @class
 *
 * @param {{numSelected: int, total: int, schema: string, selectPage: Function, selectAll: Function, selectNone: Function}} props
 */
export default class SelectionControl extends Component {
  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const classNames = 'selection-control default';

    // Select All active
    if (this.props.numSelected === this.props.total) return [
      <button type={'button'} key={`${this.props.schema}-select-all`} className={classNames} onClick={this.props.selectNone}>Select None</button>,
      <button type={'button'} key={`${this.props.schema}-select-page`} className={classNames} onClick={this.props.selectPage}>Select Page</button>
    ];

    // Select None active
    if (this.props.numSelected === 0) return [
      <button type={'button'} key={`${this.props.schema}-select-all`} className={classNames} onClick={this.props.selectAll}>Select
        All</button>,
      <button type={'button'} key={`${this.props.schema}-select-page`} className={classNames} onClick={this.props.selectPage}>Select Page</button>
    ];

    // Select Page active
    return [
      <button type={'button'} key={`${this.props.schema}-select-all`} className={classNames} onClick={this.props.selectAll}>Select
        All</button>,
      <button type={'button'} key={`${this.props.schema}-select-page`} className={classNames} onClick={this.props.selectNone}>Select
        None</button>
    ];
  }
};
