import React, {Component} from 'react';
import Pagination from 'react-js-pagination';

import '../../styles/pagination.css';

export default class PaginationLayout extends Component {
  constructor(props) {
    super(props);

    this.renderPageOptions = this.renderPageOptions.bind(this);
  }

  renderPageOptions() {
    const pageSizes = [5, 25, 50, 100];
    let pageOptions = [];

    pageSizes.forEach(size => {
      if (this.props.total >= size) {
        pageOptions.push(<option key={`option-${size}`} value={size}>{size}</option>);
      }
    });

    pageOptions.push(<option key={`option-${this.props.total}`} value={this.props.total}>All</option>);

    return pageOptions;
  }

  render() {
    const tmpEnd = this.props.activePage * this.props.pageSize;
    const end = tmpEnd > this.props.total ? this.props.total : tmpEnd;
    const start = (this.props.pageSize * (this.props.activePage - 1)) + 1;
    let pageInfo;

    if (end === start) pageInfo = `Showing ${end} of ${this.props.total}`;
    else pageInfo = `Showing ${start} - ${end} of ${this.props.total}`;

    return (
      <div className={'pagination-container'}>
        <label>
          Listings per page
          <select ref={'pageSizeSelect'} defaultValue={this.props.pageSize} onChange={this.props.updatePageSize}>
            {this.renderPageOptions()}
          </select>
        </label>
        <Pagination activePage={this.props.activePage}
                    itemsCountPerPage={this.props.pageSize}
                    totalItemsCount={this.props.total}
                    onChange={this.props.updateCurrentPage} />
        <span>{pageInfo}</span>
      </div>
    );
  }
};
