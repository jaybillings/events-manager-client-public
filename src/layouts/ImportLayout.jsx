import React, {Component} from 'react';
import app from '../services/socketio';
import {buildColumnSort, buildSortQuery} from "../utilities";

import Header from '../components/common/Header';
import ImportForm from '../components/importer/ImportForm';
import MessagePanel from '../components/common/MessagePanel';
import PendingEventsModule from '../components/pendingEvents/PendingEventsModule';
import PendingTagsModule from '../components/pendingTags/PendingTagsModule';
import PendingVenuesModule from '../components/pendingVenues/PendingVenuesModule';
import PendingOrganizersModule from '../components/pendingOrganizers/PendingOrganizersModule';
import PendingNeighborhoodsModule from '../components/pendingNeighborhoods/PendingNeighborhoodsModule';

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingEvents: [], pendingEventCount: 0,
      venues: [], organizers: [], neighborhoods: [], tags: [],
      defaultPageSize: 5, defaultSortOrder: ['created_at', -1]
    };

    this.API_URI = 'http://localhost:3030/importer';

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();

    this.importerService = app.service('importer');
    this.pendingEventsService = app.service('pending-events');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');

    this.fetchInitialData = this.fetchInitialData.bind(this);
    this.importData = this.importData.bind(this);
    this.dismissMessagesPanel = this.dismissMessagesPanel.bind(this);
  }

  componentDidMount() {
    this.fetchInitialData();

    // Register listeners
    this.importerService
      .on('status', message => {
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([message]),
          messagePanelVisible: true
        });
      })
      .on('error', error => {
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
  }

  fetchInitialData() {
    const moduleSchemaQuery = {
      $sort: buildSortQuery(this.state.defaultSortOrder),
      $limit: this.state.defaultPageSize
    };
    const otherSchemaQuery = {$sort: {name: 1}};

    this.pendingEventsService.find({query: moduleSchemaQuery}).then(message => {
      this.setState({pendingEvents: message.data, pendingEventsTotal: message.total});
    });

    this.venuesService.find({query: otherSchemaQuery}).then(message => {
      this.setState({venues: message.data});
    });

    this.orgsService.find({query: otherSchemaQuery}).then(message => {
      this.setState({organizers: message.data});
    });

    this.tagsService.find({query: otherSchemaQuery}).then(message => {
      this.setState({tags: message.data});
    });
  }

  importData(e) {
    // TODO: Handle multiple files
    e.preventDefault();

    const importUrl = `${this.API_URI}?schema=${this.schemaSelect.current.value}`;
    let importData = new FormData();

    importData.append('file', this.fileInput.current.files[0]);
    importData.append('filename', this.fileInput.current.files[0].name);

    fetch(importUrl, {
      method: 'POST',
      body: importData
    }).then((response) => {
      response.json().then((body) => {
        if (body.code >= 400) {
          this.setState(prevState => ({
            messages: [...prevState.messages, {status: 'error', details: body.message}],
            messagePanelVisible: true
          }));
        }
      });
    });
  }

  updateMessageList(newMessage) {
    let messageList = this.state.messages;
    this.setState({
      messages: messageList.concat([newMessage]),
      messagePanelVisible: true
    });
  }

  dismissMessagesPanel() {
    console.log('clicked!');
    this.setState({messages: [], messagePanelVisible: false});
  }

  childUpdateColumnSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState(columnSortState, () => this.fetchAllData());
  }

  childUpdatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  childUpdateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className="container">
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagesPanel} />
        <h2>Import Data From CSV File</h2>
        <ImportForm fileInputRef={this.fileInput} schemaSelectRef={this.schemaSelect} handleSubmit={this.importData} />
        <h2>Review Unpublished Data</h2>
        <h3>Events</h3>
        <PendingEventsModule updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
                             updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
                             pendingEvents={this.state.pendingEvents} pendingEventCount={this.state.pendingEventCount}
                             pendingEventsService={this.pendingEventsService}
                             venues={this.state.venues} organizers={this.state.organizers} tags={this.state.tags}
                             pageSize={this.state.defaultPageSize} sort={this.state.defaultSortOrder} />
        <h3>Venues</h3>
        <PendingVenuesModule updateMessageList={this.updateMessageList} />
        <h3>Organizers</h3>
        <PendingOrganizersModule updateMessageList={this.updateMessageList} />
        <h3>Neighborhoods</h3>
        <PendingNeighborhoodsModule updateMessageList={this.updateMessageList} />
        <h3>Tags</h3>
        <PendingTagsModule updateMessageList={this.updateMessageList} />
        <h2>Publish</h2>
      </div>
    );
  }
};
