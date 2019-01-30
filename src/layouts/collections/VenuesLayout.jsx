import React from "react";
import {buildSortQuery, renderTableHeader} from "../../utilities";
import app from "../../services/socketio";

import VenueRow from "../../components/venues/VenueRow";
import VenueAddForm from "../../components/venues/VenueAddForm";
import ListingsLayout from "../../components/ListingsLayout";
import PaginationLayout from "../../components/common/PaginationLayout";

/**
 * VenuesLayout is a component which lays out the venues collection page.
 * @class
 * @child
 */
export default class VenuesLayout extends ListingsLayout {
  /**
   * The class's constructor.
   * @param {object} props
   */
  constructor(props) {
    super(props, 'venues');

    Object.assign(this.state, {
      hoods: [], hoodsLoaded: false
    });

    this.hoodsService = app.service('neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
  }

  /**
   * Runs when the component mounts. Fetches data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', () => {this.fetchHoods()})
      .on('updated', () => {this.fetchHoods()})
      .on('patched', () => {this.fetchHoods()})
      .on('removed', () => {this.fetchHoods()});
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the table.
   */
  fetchAllData() {
    this.fetchListings();
    this.fetchHoods();
  }

  /**
   * Fetches data for all published venues. Handles table page size, page skipping, and column sorting.
   * @override
   */
  fetchListings() {
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;

    this.listingsService.find({
      query: {
        $sort: buildSortQuery(sort),
        $limit: pageSize,
        $skip: pageSize * (currentPage - 1)
      }
    }).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true});
    });
  }

  /**
   * Fetches data for all published neighborhoods.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    });
  }

  /**
   * Renders the venue collection table.
   * @override
   * @returns {*}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No venues to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['fk_hood', 'Neighborhood'],
      ['updated_at', 'Last Modified']
    ]);

    const hoods = this.state.hoods;

    return ([
      <PaginationLayout
        key={'venues-pagination'} schema={'venues'} total={this.state.listingsTotal} pageSize={this.state.pageSize}
        activePage={this.state.currentPage} updatePageSize={this.props.updatePageSize}
        updateCurrentPage={this.props.updateCurrentPage}
      />,
      <table key={'venues-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.props.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.listings.map(venue =>
            <VenueRow
              key={venue.id} listing={venue} hood={hoods.find(n => {return n.id === venue.hood_id})} hoods={hoods}
              updateListing={this.props.updateListing} deleteListing={this.props.deleteListing}
              copyAsPending={this.copyAsPending} checkForPending={this.checkForPending}
            />
          )
        }
        </tbody>
      </table>
    ]);
  }

  /**
   * Renders the form for adding a new venue.
   * @override
   * @returns {*}
   */
  renderAddForm() {
    if (!this.state.hoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenueAddForm hoods={this.state.hoods} createListing={this.createListing} />;
  }
};
