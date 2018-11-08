import React, {Component} from "react";
import app from "../services/socketio";
import {buildColumnSort} from "../utilities";

import Header from "../components/common/Header";
import ImportForm from "../components/importer/ImportForm";
import MessagePanel from "../components/common/MessagePanel";
import PendingEventsModule from "../components/pendingEvents/PendingEventsModule";
import PendingTagsModule from "../components/pendingTags/PendingTagsModule";
import PendingVenuesModule from "../components/pendingVenues/PendingVenuesModule";
import PendingOrganizersModule from "../components/pendingOrganizers/PendingOrganizersModule";
import PendingNeighborhoodsModule from "../components/pendingNeighborhoods/PendingNeighborhoodsModule";

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingEvents: [], pendingEventCount: 0,
      venues: [], orgs: [], hoods: [], tags: [],
      defaultPageSize: 5, defaultSortOrder: ['created_at', -1]
    };

    this.API_URI = 'http://localhost:3030/importer';

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();

    this.importerService = app.service('importer');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.hoodsService = app.service('neighborhoods');
    this.tagsService = app.service('tags');

    this.fetchInitialData = this.fetchInitialData.bind(this);
    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);
    this.updateMessageList = this.updateMessageList.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
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
    const otherSchemaQuery = {$sort: {name: 1}};

    this.venuesService.find({query: otherSchemaQuery}).then(message => {
      this.setState({venues: message.data});
    });

    this.orgsService.find({query: otherSchemaQuery}).then(message => {
      this.setState({orgs: message.data});
    });

    this.hoodsService.find({query: otherSchemaQuery}).then(message => {
      this.setState({hoods: message.data});
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
          this.updateMessageList({status: 'error', details: body.message});
        }
      });
    });
  }

  publishListings() {

  }

  updateMessageList(newMessage) {
    this.setState(prevState => ({
      messages: [newMessage, ...prevState.messages],
      messagePanelVisible: true
    }));
  }

  dismissMessagePanel() {
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
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>Import Data From CSV File</h2>
        <ImportForm fileInputRef={this.fileInput} schemaSelectRef={this.schemaSelect} handleSubmit={this.importData} />
        <h2>Review Unpublished Data</h2>
        <PendingEventsModule
          venues={this.state.venues} orgs={this.state.orgs} tags={this.state.tags}
          defaultPageSize={this.state.defaultPageSize} defaultSortOrder={this.state.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingVenuesModule
          hoods={this.state.hoods}
          defaultPageSize={this.state.defaultPageSize} defaultSortOrder={this.state.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingOrganizersModule
          defaultPageSize={this.state.defaultPageSize} defaultSortOrder={this.state.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingNeighborhoodsModule
          defaultPageSize={this.state.defaultPageSize} defaultSortOrder={this.state.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingTagsModule
          defaultPageSize={this.state.defaultPageSize} defaultSortOrder={this.state.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <button type={'button'} className={'button-primary button-publish'} onClick={this.publishListings}>Publish All Pending Listings</button>
      </div>
    );
  }
};
