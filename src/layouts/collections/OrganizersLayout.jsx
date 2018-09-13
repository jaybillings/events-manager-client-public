import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PaginationLayout from '../../components/common/PaginationLayout';
import OrganizersTable from '../../components/organizers/OrganizersTable';
import OrganizerAddForm from '../../components/organizers/OrganizerAddForm';

export default class OrganizersLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      organizers: [], orgsLoaded: false, orgsTotal: 0,
      pageSize: 5, currentPage: 1, sort: ['updated_at', -1]
    };

    this.orgsService = app.service('organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.buildSortQuery = this.buildSortQuery.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.orgsService
      .on('created', message => {
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
    this.orgsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.orgsService.find({
      query: {
        $sort: this.buildSortQuery(),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({organizers: message.data, orgsTotal: message.total, orgsLoaded: true});
    });
  }

  buildSortQuery() {
    if (this.state.sort[0] === 'name') {
      return {'name': this.state.sort[1]};
    }
    return {[this.state.sort[0]]: this.state.sort[1], 'name': 1};
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    console.log(`active page is ${page}`);
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  updateColumnSort(e) {
    let target = (e.target.nodeName === 'TH') ? e.target : e.target.closest('th');
    const column = target.dataset.sortType;
    const direction = (column === this.state.sort[0]) ? -(parseInt(this.state.sort[1], 10)) : -1;

    this.setState({sort: [column, direction]}, () => this.fetchAllData());
  }

  renderTable() {
    if (!this.state.orgsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <OrganizersTable organizers={this.state.organizers} sort={this.state.sort}
                            handleColumnClick={this.updateColumnSort} />
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <h2>Organizers</h2>
        <h3>View/Modify</h3>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage}
                          total={this.state.orgsTotal}
                          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
        <h3>Add New Organizer</h3>
        <OrganizerAddForm />
      </div>
    );
  }
};
