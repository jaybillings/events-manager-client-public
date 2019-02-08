import React, {Component} from 'react';

import '../../styles/selection-control.css';

/**
 * The SelectionControl component displays a button for selecting all/no rows.
 *
 * @class
 */
export default class SelectionControl extends Component {
  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    if (this.props.numSelected > 0) {
      return <button type={'button'} className={'selection-control default'} onClick={this.props.selectNone}>Select None</button>;
    }

    return <button type={'button'} className={'selection-control default'} onClick={this.props.selectAll}>Select All</button>;
  }
};
