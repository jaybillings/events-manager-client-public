import React, {Component} from "react";
import app from "../services/socketio";

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

    this.state = {messages: [], messagePanelVisible: false};

    this.API_URI = 'http://localhost:3030/importer';
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();
    this.eventsModule = React.createRef();
    this.venuesModule = React.createRef();
    this.orgsModule = React.createRef();
    this.hoodsModule = React.createRef();
    this.tagsModule = React.createRef();

    this.importerService = app.service('importer');

    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);
    this.updateMessageList = this.updateMessageList.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    // Register listeners
    this.importerService.on('status', message => {
      this.updateMessageList({status: 'info', details: message.details});
    });
  }

  componentWillUnmount() {
    this.importerService.removeAllListeners('status');
  }

  importData(e) {
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
    Promise
      .all([
        this.hoodsModule.current.publishListings(),
        this.tagsModule.current.publishListings(),
        this.orgsModule.current.publishListings()
      ])
      .then(this.venuesModule.current.publishListings())
      .then(this.eventsModule.current.publishListings())
      .catch((err) => console.log(err));
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
          ref={this.eventsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingVenuesModule
          ref={this.venuesModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingOrganizersModule
          ref={this.orgsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingNeighborhoodsModule
          ref={this.hoodsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingTagsModule
          ref={this.tagsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <button type={'button'} className={'button-primary button-publish'} onClick={this.publishListings}>
          Publish All Pending Listings
        </button>
      </div>
    );
  }
};
