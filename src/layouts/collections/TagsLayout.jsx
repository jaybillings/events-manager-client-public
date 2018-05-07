import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PaginationLayout from '../../components/common/PaginationLayout';
import TagsTable from '../../components/tags/TagsTable';
import TagsAddForm from '../../components/tags/TagsAddForm';

export default class TagsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: [], tagsLoaded: false, tagsTotal: 0,
      pageSize: 5, currentPage: 1, sort: {updated_at: -1}
    };
    this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.tagsService
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
    this.tagsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.tagsService.find({
      query: {
        $sort: this.state.sort,
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({tags: message.data, tagsTotal: message.total, tagsLoaded: true})
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
    if (!this.state.tagsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <TagsTable tags={this.state.tags} />
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <h2>Tags</h2>
        <h3>View/Modify</h3>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage} total={this.state.tagsTotal}
                          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
        <h3>Add New Tag</h3>
        <TagsAddForm />
      </div>
    );
  }
};
