import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PaginationLayout from '../../components/common/PaginationLayout';
import NeighborhoodsTable from '../../components/neighborhoods/NeighborhoodsTable';
import NeighborhoodAddForm from '../../components/neighborhoods/NeighborhoodAddForm';

export default class NeighborhoodsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      neighborhoods: [], hoodsLoaded: false, hoodsTotal: 0,
      pageSize: 5, currentPage: 1, sort: {updated_at: -1}
    };
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.hoodsService
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
    this.hoodsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.hoodsService.find({
      query: {
        $sort: this.state.sort,
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({neighborhoods: message.data, hoodsTotal: message.total, hoodsLoaded: true})
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
    if (!this.state.hoodsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <NeighborhoodsTable neighborhoods={this.state.neighborhoods} />
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <h2>Neighborhoods</h2>
        <h3>View/Modify</h3>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage}
                          total={this.state.hoodsTotal} schema={'hoods'}
                          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
        <h3>Add New Neighborhood</h3>
        <NeighborhoodAddForm />
      </div>
    );
  }
};
