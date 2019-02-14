import React, {Component} from 'react';

/**
 * SortIndicator displays XML icons indicating sort order.
 * @note From Typicon set -- https://simplesvg.com/icon-sets/typcn/
 *
 * @class
 */
export default class SortIndicator extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{direction: int}} props
   */
  constructor(props) {
    super(props);
  }

  /**
   * Renders the component
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    if (this.props.direction === -1) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"
             style={{verticalAlign: '-.125em', transform: 'rotate(360deg)'}} viewBox="0 0 320 512">
          <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"
                fill="#33c3f0" />
        </svg>
      )
    } else if (this.props.direction === 1) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"
             style={{verticalAlign: '-.125em', transform: 'rotate(360deg)'}} viewBox="0 0 320 512">
          <path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"
                fill="#33c3f0" />
        </svg>
      )
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="20" height="20"
           style={{verticalAlign: '-.125em', transform: 'rotate(360deg)'}} viewBox="0 0 320 512">
        <path
          d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"
          fill="#33c3f0" />
      </svg>
    )
  }
};
