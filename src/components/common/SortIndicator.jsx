import React, {Component} from 'react';
import {MdExpandLess, MdExpandMore, MdUnfoldMore} from "react-icons/md";

/**
 * `SortIndicator` displays XML icons indicating sort order.
 *
 * @class
 * @param {{direction: int}} props
 */
export default class SortIndicator extends Component {
  /**
   * Renders the component
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    if (this.props.direction === -1) return <MdExpandLess />;
    else if (this.props.direction === 1) return <MdExpandMore />;
    return <MdUnfoldMore/>;
  }
};
