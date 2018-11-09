import React, {Component} from 'react';
import Pagination from 'react-js-pagination';

import "../../styles/pagination.css";

export default class PaginationLayout extends Component {
  constructor(props) {
    super(props);

    this.renderPageOptions = this.renderPageOptions.bind(this);
  }

  renderPageOptions() {
    const schema = this.props.schema;
    const pageSizes = [5, 25, 50, 100];
    let pageOptions = [];

    pageSizes.forEach(size => {
      if (this.props.total >= size) {
        pageOptions.push(<option key={`${schema}-paging-${size}`} value={size}>{size}</option>);
      }
    });
    pageOptions.push(<option key={`option-${this.props.total}`} value={this.props.total}>All</option>);

    return pageOptions;
  }

  render() {
    const tmpEnd = this.props.activePage * this.props.pageSize;
    const end = tmpEnd > this.props.total ? this.props.total : tmpEnd;
    const start = (this.props.pageSize * (this.props.activePage - 1)) + 1;
    const pageInfo = end === start ? `Showing ${end} of ${this.props.total}` : `Showing ${start} - ${end} of ${this.props.total}`;

    return (
      <div className={'pagination-container'}>
        <select defaultValue={this.props.pageSize} onChange={this.props.handleUpdatePageSize}>{this.renderPageOptions()}</select>
        <Pagination
          activePage={this.props.activePage} itemsCountPerPage={this.props.pageSize} totalItemsCount={this.props.total}
          onChange={this.props.handleUpdateCurrentPage}
        />
        <span>{pageInfo}</span>
      </div>
    );
  }
};
