import React from "react";
import {buildSortQuery} from "../../utilities";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import VenuesTable from "../../components/venues/VenuesTable";
import VenueAddForm from "../../components/venues/VenueAddForm";
import MessagePanel from "../../components/common/MessagePanel";
import ListingsLayout from "../../components/ListingsLayout";

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
    const reloadVenues = () => {
      this.setState({currentPage: 1}, () => this.fetchListings())
    };

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({status: 'success', details: `Created venue #${message.id} - "${message.name}"`});
        reloadVenues();
      })
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Updated venue #${message.id} - "${message.name}"`});
        reloadVenues();
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Updated venue #${message.id} - "${message.name}"`});
        reloadVenues();
      })
      .on('removed', message => {
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted venue #${message.id} - "${message.name}"`
        });
        reloadVenues();
      });

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

    const venues = this.state.listings;
    const hoods = this.state.hoods;

    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.listingsTotal;
    const sort = this.state.sort;

    return <VenuesTable
      listings={venues} listingsTotal={total} hoods={hoods}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      updateColumnSort={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage}
      updateListing={this.updateListing} deleteListing={this.deleteListing}
    />;
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

    const hoods = this.state.hoods;

    return <VenueAddForm hoods={hoods} createListing={this.createListing} />;
  }
};
