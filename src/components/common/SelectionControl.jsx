import React, {Component} from 'react';
import '../../styles/selection-control.css';

export default class SelectionControl extends Component {
  render() {
    const numSelected = this.props.numSelected;
    const total = this.props.totalCount;
    const schema = this.props.schema;

    return (
      <div className={'selection-control'}>
        <button type={'button'} onClick={this.props.selectAll}>Select All</button>
        <button type={'button'} onClick={this.props.selectNone}>Select None</button>
        <p>{numSelected} / {total} {schema}</p>
      </div>
    );
  }
};
