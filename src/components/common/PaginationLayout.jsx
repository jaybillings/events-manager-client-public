import React, {Component} from 'react';
import Pagination from 'react-js-pagination';

import "../../styles/pagination.css";

/**
 * The PaginationLayout component displays table pagination.
 *
 * @class
 */
export default class PaginationLayout extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{schema: String, total: int, pageSize: int, activePage: int, updatePageSize: Function, updateCurrentPage: Function}} props
   */
  constructor(props) {
    super(props);

    this.renderPageOptions = this.renderPageOptions.bind(this);
  }

  /**
   * Renders the rows-per-page option block.
   *
   * @returns {Array}
   */
  renderPageOptions() {
    const schema = this.props.schema;
    const includeAll = this.props.includeAll;
    const pageSizes = includeAll ? [5, 25, 50, 100] : [5, 10]; // TODO: Fix this hack. Include 'sizes' prop.
    let pageOptions = [];

    pageSizes.forEach(size => {
      if (this.props.total > size) {
        pageOptions.push(<option key={`${schema}-paging-${size}`} value={size}>{size}</option>);
      }
    });

    if (this.props.includeAll) pageOptions.push(<option key={`option-${this.props.total}`} value={this.props.total}>All</option>);

    return pageOptions;
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const tmpEnd = this.props.activePage * this.props.pageSize;
    const end = tmpEnd > this.props.total ? this.props.total : tmpEnd;
    const start = (this.props.pageSize * (this.props.activePage - 1)) + 1;
    const pageInfo = end === start ? `Showing ${end} of ${this.props.total}` : `Showing ${start} - ${end} of ${this.props.total}`;

    return (
      <div className={'pagination-container'}>
        <select defaultValue={this.props.pageSize}
                onChange={this.props.updatePageSize}>{this.renderPageOptions()}</select>
        <Pagination
          activePage={this.props.activePage} itemsCountPerPage={this.props.pageSize} totalItemsCount={this.props.total}
          onChange={this.props.updateCurrentPage}
        />
        <span>{pageInfo}</span>
      </div>
    );
  }
};
