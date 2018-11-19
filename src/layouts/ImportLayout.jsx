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

    this.state = {messages: [], messagePanelVisible: false, venues: [], orgs: [], hoods: [], tags: []};

    this.API_URI = 'http://localhost:3030/importer';
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];
    this.liveSchemaQuery = {$sort: {name: 1}};

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();
    this.eventsModule = React.createRef();
    this.venuesModule = React.createRef();
    this.orgsModule = React.createRef();
    this.hoodsModule = React.createRef();
    this.tagsModule = React.createRef();

    this.importerService = app.service('importer');
    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.hoodsService = app.service('neighborhoods');
    this.tagsService = app.service('tags');

    this.fetchLiveData = this.fetchLiveData.bind(this);
    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);
    this.updateMessageList = this.updateMessageList.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchLiveData();

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

    const liveServices = new Map([
      ['venues', this.venuesService],
      ['orgs', this.orgsService],
      ['hoods', this.hoodsService],
      ['tags', this.tagsService]
    ]);

    const fetchCallbacks = {
      venues: this.fetchVenues,
      orgs: this.fetchOrgs,
      hoods: this.fetchHoods,
      tags: this.fetchTags
    };

    // TODO: Register listeners to refresh live data on create/update
    liveServices.forEach((service, schema) => {
      service
        .on('created', () => {
          fetchCallbacks[schema]();
        })
        .on('updated', () => {
          fetchCallbacks[schema]();
        })
        .on('removed', () => {
          fetchCallbacks[schema]();
        })
        .on('patched', () => {
          fetchCallbacks[schema]();
        });
    });
  }

  componentWillUnmount() {
    this.importerService
      .removeAllListeners('status')
      .removeAllListeners('error');

    const liveServices = new Map([
      ['venues', this.venuesService],
      ['orgs', this.orgsService],
      ['hoods', this.hoodsService],
      ['tags', this.tagsService]
    ]);

    liveServices.forEach(service => {
      service
        .removeAllListeners('created')
        .removeAllListeners('updated')
        .removeAllListeners('patched')
        .removeAllListeners('removed');
    });
  }

  fetchLiveData() {
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchHoods();
    this.fetchTags();
  }

  fetchVenues() {
    this.venuesService.find({query: this.liveSchemaQuery}).then(message => {
      this.setState({venues: message.data});
    });
  }

  fetchOrgs() {
    this.orgsService.find({query: this.liveSchemaQuery}).then(message => {
      this.setState({orgs: message.data});
    });
  }

  fetchHoods() {
    this.hoodsService.find({query: this.liveSchemaQuery}).then(message => {
      this.setState({hoods: message.data});
    });
  }

  fetchTags() {
    this.tagsService.find({query: this.liveSchemaQuery}).then(message => {
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
          ref={this.eventsModule}
          venues={this.state.venues} orgs={this.state.orgs} tags={this.state.tags}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingVenuesModule
          ref={this.venuesModule} hoods={this.state.hoods}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingOrganizersModule
          ref={this.orgsModule}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingNeighborhoodsModule
          ref={this.hoodsModule}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <PendingTagsModule
          ref={this.tagsModule}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList}
        />
        <button type={'button'} className={'button-primary button-publish'} onClick={this.publishListings}>Publish All
          Pending Listings
        </button>
      </div>
    );
  }
};
