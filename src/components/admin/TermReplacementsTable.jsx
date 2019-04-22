import React, {Component} from 'react';

export default class TermReplacementsTable extends Component {
  render() {
    return (
      <div className={'module-side'}>
        <h4>Current Replacements</h4>
        <span className={'toggleExpand'}>+</span>
      </div>
    );
  }
};
