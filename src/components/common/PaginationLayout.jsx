import React, {Component} from 'react';
import Pagination from 'react-js-pagination';

import "../../styles/pagination.css";

/**
 * `PaginationLayout` displays pagination for data tables.
 *
 * @class
 * @param {{schema: String, total: int, pageSize: int, activePage: int, updatePageSize: Function, updateCurrentPage: Function}} props
 */
export default class PaginationLayout extends Component {
  constructor(props) {
    super(props);

    this.handlePageChange = this.handlePageChange.bind(this);
    this.renderPageOptions = this.renderPageOptions.bind(this);
  }

  /**
   * `handlePageChange` handles the select change event by triggering a function to
   * update the page number.
   *
   * @param {Event} e
   */
  handlePageChange(e) {
    const newPageSize = e.target.value;
    if (typeof newPageSize === 'undefined' || newPageSize === this.props.pageSize) return;
    this.props.updatePageSize(newPageSize);
  }

  /**
   * `renderPageOptions` generates the rows-per-page option block as JSX.
   *
   * @returns {Array}
   */
  renderPageOptions() {
    const schema = this.props.schema;
    const pageSizes = this.props.includeAll ? [5, 25, 50, 100] : [5, 10]; // TODO: This is a hack. Ingest 'sizes' as prop.
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
   * @override
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
        <select defaultValue={this.props.pageSize} onChange={this.handlePageChange}>
          {this.renderPageOptions()}
        </select>
        <Pagination
          activePage={this.props.activePage} itemsCountPerPage={this.props.pageSize}
          totalItemsCount={this.props.total} onChange={this.props.updateCurrentPage}
        />
        <span>{pageInfo}</span>
      </div>
    );
  }
};
