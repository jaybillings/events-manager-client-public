import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PaginationLayout from '../../components/common/PaginationLayout';
import VenuesTable from '../../components/venues/VenuesTable';
import VenueAddForm from '../../components/venues/VenueAddForm';

export default class VenuesLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      venues: [], neighborhoods: [], venuesTotal: 0, venuesLoaded: false, hoodsLoaded: false,
      pageSize: 5, currentPage: 1, sort: { updated_at: -1}
    };

    this.venuesService = app.service('venues');
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.renderForm = this.renderForm.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.venuesService
      .on('created', (message) => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: 5}, () => this.fetchAllData());
      });
  }

  componentWillUnmount() {
    this.venuesService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.venuesService.find({
      query: {
        $sort: this.state.sort,
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({venues: message.data, venuesTotal: message.total, venuesLoaded: true});
    });

    this.hoodsService.find({query: {$sort: {name: 1}}}).then(message => {
      this.setState({neighborhoods: message.data, hoodsLoaded: true});
    });
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    console.log(`active page is ${page}`);
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  renderTable() {
    if (!(this.state.venuesLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenuesTable venues={this.state.venues} neighborhoods={this.state.neighborhoods}/>;
  }

  renderForm() {
    if (!this.state.hoodsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <VenueAddForm neighborhoods={this.state.neighborhoods}/>;
  }

  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Venues</h2>
        <h3>View/Modify</h3>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage} total={this.state.venuesTotal}
                          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
        <h3>Add New Venue</h3>
        {this.renderForm()}
      </div>
    );
  }
};
