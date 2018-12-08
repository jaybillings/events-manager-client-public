import React, {Component} from 'react';
import '../../styles/selection-control.css';

export default class SelectionControl extends Component {
  render() {
    if (this.props.numSelected > 0) {
      return <button type={'button'} className={'selection-control'} onClick={this.props.selectNone}>Select None</button>;
    }
    return <button type={'button'} className={'selection-control'} onClick={this.props.selectAll}>Select All</button>;
  }
};
