import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import ImportForm from '../components/importer/ImportForm';
import MessagePanel from '../components/common/MessagePanel';
import PaginationLayout from "../components/common/PaginationLayout";
import PendingEventsTable from "../components/pendingEvents/PendingEventsTable";

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false, pendingEvents: [], pendingEventsLoaded: false,
      pendingEventsTotal: 0, pageSize: 25, currentPage: 1, sort: ['created_at', -1], filter: {}
    };

    this.importerService = app.service('importer');
    this.pendingEventsService = app.service('pending-events');
    this.fileInput = React.createRef();

    this.fetchAllData = this.fetchAllData.bind(this);
    this.buildSortQuery = this.buildSortQuery.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.renderTable = this.renderTable.bind(this);

    this.importData = this.importData.bind(this);
    this.dismissMessagesPanel = this.dismissMessagesPanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.importerService
      .on('status', message => {
        console.log('importer status ', message);
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([message]),
          messagePanelVisible: true
        });
      })
      .on('error', error => {
        console.log('importer error ', error);
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([{status: 'error', details: error.message}]),
          messagePanelVisible: true
        });
      });

    this.pendingEventsService
      .on('created', message => {
        console.log('created', message);
        this.setState({currentPage: 1, pageSize: 25}, () => this.fetchAllData());
      })
      .on('updated', message => {
        console.log('updated', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({currentPage: 1, pageSize: 25}, () => this.fetchAllData());
      })
      .on('error', error => {
        console.log('pending-events created ', error);
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([{status: 'error', details: error.message}]),
          messagePanelVisible: true
        });
      });
  }

  componentWillUnmount() {
    this.importerService
      .removeListener('status')
      .removeListener('error');

    this.pendingEventsService
      .removeListener('created')
      .removeListener('updated')
      .removeListener('removed')
      .removeListener('error');
  }

  fetchAllData() {
    console.log('in fetchalldata');
    let query = {
      $sort: this.buildSortQuery(),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };
    Object.assign(query, this.state.filter);

    this.pendingEventsService.find({query: query}).then(message => {
      this.setState({pendingEvents: message.data, pendingEventsTotal: message.total, pendingEventsLoaded: true});
    });
  }

  importData(e) {
    // TODO: Handle multiple files
    e.preventDefault();
    console.log('in importdata');
    //const fileToImport = this.fileInput.current.files[0];
    let importData = new FormData();
    importData.append('file', this.fileInput.current.files[0]);
    importData.append('filename', this.fileInput.current.files[0].name);

    fetch('http://localhost:3030/importer', {
      method: 'POST',
      body: importData
    }).then((response) => {
      response.json().then((body) => {
        // TODO: Print result to messages, if error
        console.log(body);
        if (body.code >= 400) {
          this.setState(prevState => ({
            messages: [...prevState.messages, {status: 'error', details: body.message}],
            messagePanelVisible: true
          }));
        }
      });
    });
  }

  buildSortQuery() {
    if (this.state.sort[0] === 'name') {
      return {'name': this.state.sort[1]};
    }
    return {[this.state.sort[0]]: this.state.sort[1], 'name': 1}
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    console.log(`active page is ${page}`);
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  updateColumnSort(e) {
    const target = (e.target.nodeName === 'TH') ? e.target : e.target.closest('th');
    const column = target.dataset.sortType;
    const direction = (column === this.state.sort[0]) ? -(parseInt(this.state.sort[1], 10)) : -1;

    this.setState({sort: [column, direction]}, () => this.fetchAllData());
  }

  dismissMessagesPanel() {
    console.log('clicked!');
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderTable() {
    if (!this.state.pendingEventsLoaded) return <p>Data is loading ... Please be patient...</p>;

    return <PendingEventsTable pendingEvents={this.state.pendingEvents} sort={this.state.sort}
                               handleColumnClick={this.updateColumnSort} />;
  }

  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className="container">
        <Header />
        <h2>Import</h2>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagesPanel} />
        <h3>Import Data From File</h3>
        <ImportForm fileInputRef={this.fileInput} handleSubmit={this.importData} />
        <h3>Review Unpublished Data</h3>
        <PaginationLayout pageSize={this.state.pageSize} activePage={this.state.currentPage}
                          total={this.state.pendingEventsTotal} updatePageSize={this.updatePageSize}
                          updateCurrentPage={this.updateCurrentPage} />
        {this.renderTable()}
        <h3>Publish</h3>
      </div>
    );
  }
};
