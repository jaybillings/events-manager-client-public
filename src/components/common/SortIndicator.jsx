import React, {Component} from 'react';

export default class SortIndicator extends Component {
  render() {
    if (this.props.direction === -1) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="28"><path d="M16 17a.99.99 0 0 1-.297.703l-7 7C8.516 24.89 8.265 25 8 25s-.516-.109-.703-.297l-7-7A.996.996 0 0 1 0 17c0-.547.453-1 1-1h14c.547 0 1 .453 1 1z"/></svg>
      )
    } else if (this.props.direction === 1) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="28"><path d="M16 11c0 .547-.453 1-1 1H1c-.547 0-1-.453-1-1a.99.99 0 0 1 .297-.703l7-7C7.484 3.11 7.735 3 8 3s.516.109.703.297l7 7A.996.996 0 0 1 16 11z"/></svg>
      )
    }

    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="28"><path d="M16 17a.99.99 0 0 1-.297.703l-7 7C8.516 24.89 8.265 25 8 25s-.516-.109-.703-.297l-7-7A.996.996 0 0 1 0 17c0-.547.453-1 1-1h14c.547 0 1 .453 1 1zm0-6c0 .547-.453 1-1 1H1c-.547 0-1-.453-1-1a.99.99 0 0 1 .297-.703l7-7C7.484 3.11 7.735 3 8 3s.516.109.703.297l7 7A.996.996 0 0 1 16 11z"/></svg>
    )
  }
};
