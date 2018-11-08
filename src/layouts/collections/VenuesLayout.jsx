import React, {Component} from "react";
import {buildColumnSort, buildSortQuery} from "../../utilities";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import VenuesTable from "../../components/venues/VenuesTable";
import VenueAddForm from "../../components/venues/VenueAddForm";
import MessagePanel from "../../components/common/MessagePanel";

export default class VenuesLayout extends Component {
  constructor(props) {
    super(props);

    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];
    this.defaultQuery = {$sort: {name: 1}, $select: ['name'], $limit: 100};

    this.state = {
      venues: [], hoods: [], venuesTotal: 0, venuesLoaded: false, hoodsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.venuesService = app.service('venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.deleteVenue = this.deleteVenue.bind(this);
    this.saveVenue = this.saveVenue.bind(this);
    this.createVenue = this.createVenue.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.venuesService
      .on('created', message => {
        console.log('venue created', message);
        this.updateMessagePanel({status: 'success', details: `Created venue #${message.id} - ${message.name}`});
        this.setState({currentPage: 1}, () => this.fetchVenues());
      })
      .on('patched', message => {
        console.log('venue patched', message);
        this.updateMessagePanel({status: 'success', details: `Updated venue #${message.id} - ${message.name}`});
        this.fetchVenues();
      })
      .on('removed', message => {
        console.log('venue removed', message);
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted venue #${message.id} - ${message.name}`
        });
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
    this.venuesService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');

    this.hoodsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.fetchVenues();
    this.fetchHoods();
  }

  fetchVenues() {
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;

    this.venuesService.find({
      query: {
        $sort: buildSortQuery(sort),
        $limit: pageSize,
        $skip: pageSize * (currentPage - 1)
      }
    }).then(message => {
      this.setState({venues: message.data, venuesTotal: message.total, venuesLoaded: true});
    });
  }

  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(message => {
      this.setState({hoods: message.data, hoodsLoaded: true});
    })
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchVenues());
  }

  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchVenues());
  }

  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState(colSortState, () => this.fetchVenues());
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: messageList.concat([msg]), messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  deleteVenue(id) {
    this.venuesService.remove(id).then(message => console.log('removing venue', message));
  }

  saveVenue(id, newData) {
    this.venuesService.patch(id, newData).then(message => {
      console.log('patching venue', message);
    }, err => {
      console.log('error patching venue', err);
      this.updateMessagePanel(err);
    });
  }

  createVenue(venueObj) {
    this.venuesService.create(venueObj).then(message => {
      console.log('creating venue', message);
    }, err => {
      console.log('error creating venue', err);
      this.updateMessagePanel(err);
    });
  }

  renderTable() {
    if (!(this.state.venuesLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const venues = this.state.venues;
    const hoods = this.state.hoods;

    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.venuesTotal;
    const sort = this.state.sort;

    return <VenuesTable
      listings={venues} listingsTotal={total} hoods={hoods}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      handleColumnClick={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage} deleteListing={this.deleteVenue} saveListing={this.saveVenue}
    />;
  }

  renderAddForm() {
    if (!this.state.hoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const hoods = this.state.hoods;
    return <VenueAddForm hoods={hoods} createVenue={this.createVenue}/>;
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
