import React, {Component} from 'react';

import '../../styles/filters.css';

export default class Filters extends Component {
  constructor(props) {
    super(props);

    this.state = {currentFilter: 'none'};

    this.handleSelection = this.handleSelection.bind(this);
  }

  handleSelection(e) {
    const tmpFilter = e.target.dataset.filterType;
    const filter = (this.state.currentFilter === tmpFilter) ? 'none' : tmpFilter;

    console.log('filter', filter);

    this.setState({'currentFilter': filter});
    this.props.updateFilters(filter);
  }

  renderButton(type, text, isActive) {
    let activeClass = isActive ? 'button-primary' : '';
    return <button key={`${type}-${isActive}`} type={'button'} data-filter-type={type} className={activeClass} onClick={this.handleSelection}>{text}</button>
  }

  render() {
    const currentFilter = this.state.currentFilter;
    let filterType = currentFilter === 'none' ? 'All' : currentFilter;
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
        <h3>Filter Results - Showing {filterType}</h3>
        {buttons}
      </div>
    );
  }
};
