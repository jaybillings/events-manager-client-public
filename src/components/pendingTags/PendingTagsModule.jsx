import React, {Component} from 'react';
import {buildSortQuery, renderTableHeader} from '../../utilities';
import app from '../../services/socketio';

import PaginationLayout from '../common/PaginationLayout';
import PendingTagRow from './PendingTagRow';

import '../../styles/schema-table.css';

export default class PendingTagsModule extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingTags: [], pendingTagsCount: 0,
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.pendingTagService = app.service('pending-tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);
    this.updateColumnSortSelf = this.props.updateColumnSort.bind(this);
    this.updatePageSizeSelf = this.props.updatePageSize.bind(this);
    this.updateCurrentPageSelf = this.props.updateCurrentPage.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingTagService
      .on('created', message => {
        this.props.updateMessageList(message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        this.props.updateMessageList(message);
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({status: 'success', details: `Updated ${message.name} successfully.`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList(message);
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('error', error => {
        this.props.updateMessageList({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.pendingTagService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('patched')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    this.pendingTagService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      console.log('find pending-tags', message);
      this.setState({pendingTags: message.data, pendingTagsCount: message.total});
    });
  }

  discardListing(id) {
    this.pendingTagService.remove(id).then(message => console.log('removed', message));
  }

  saveChanges(id, newData) {
    this.pendingTagService.patch(id, newData).then(message => console.log('patched', message));
  }

  render() {
    const pendingTags = this.state.pendingTags;
    const pendingTagsCount = this.state.pendingTagsCount;

    if (!pendingTags) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingTagsCount === 0) {
      return <p>No pending tags to list.</p>;
    }

    const titleMap = new Map([
      ['name', 'Name'],
      ['created_at', 'Imported On']
    ]);
    const columnSort = this.state.sort;
    const clickHandler = this.updateColumnSortSelf;
    const currentPage = this.state.currentPage;
    const pageSize = this.state.pageSize;

    return (
      [
        <PaginationLayout
          key={'pending-tags-pagination'}
          pageSize={pageSize} activePage={currentPage} total={pendingTagsCount}
          updatePageSize={this.updatePageSizeSelf} updateCurrentPage={this.updateCurrentPageSelf}
          schema={'pending-tags'}
        />,
        <table className={'schema-table'} key={'pending-tags-table'}>
          <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
          <tbody>
          {pendingTags.map(tag =>
            <PendingTagRow key={`tag-${tag.id}`} pendingTag={tag}
                           saveChanges={this.saveChanges} discardListing={this.discardListing} />)}
          </tbody>
        </table>
      ]
    );
  }
};
