import React from "react";
import {buildSortQuery} from "../../utilities";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import VenuesTable from "../../components/venues/VenuesTable";
import VenueAddForm from "../../components/venues/VenueAddForm";
import MessagePanel from "../../components/common/MessagePanel";
import ListingsLayout from "../../components/ListingsLayout";

export default class VenuesLayout extends ListingsLayout {
  constructor(props) {
    super(props, 'venues');

    this.defaultQuery = {$sort: {name: 1}, $select: ['name'], $limit: 100};

    this.state = {
      listings: [], hoods: [], listingsTotal: 0, listingsLoaded: false, hoodsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.hoodsService = app.service('neighborhoods');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        console.log('venue created', message);
        this.updateMessagePanel({status: 'success', details: `Created new venue "${message.name}"`});
        this.setState({currentPage: 1}, () => this.fetchVenues());
      })
      .on('patched', message => {
        console.log('venue patched', message);
        this.updateMessagePanel({status: 'success', details: `Updated venue "${message.name}"`});
        this.fetchVenues();
      })
      .on('removed', message => {
        console.log('venue removed', message);
        this.updateMessagePanel({status: 'success', details: `Permanently deleted venue "${message.name}"`});
        this.setState({currentPage: 1}, () => this.fetchVenues());
      })
      .on('error', error => {
        console.log('venue error', error);
        this.updateMessagePanel({status: 'error', details: error.message});
      });

    this.hoodsService
      .on('created', message => {
        console.log('hood created', message);
        this.fetchHoods();
      })
      .on('patched', message => {
        console.log('hood patched', message);
        this.fetchHoods();
      })
      .on('removed', message => {
        console.log('hood removed', message);
        this.fetchHoods();
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.fetchVenues();
    this.fetchHoods();
  }

  fetchVenues() {
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

  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    })
  }

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
      updateCurrentPage={this.updateCurrentPage} deleteListing={this.deleteListing} saveListing={this.saveListing}
    />;
  }

  renderAddForm() {
    if (!this.state.hoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenueAddForm hoods={this.state.hoods} createListing={this.createListing}/>;
  }

  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>All Venues</h2>
        {this.renderTable()}
        <h3>Add New Venue</h3>
        {this.renderAddForm()}
      </div>
    );
  }
};
