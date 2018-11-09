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
      pendingHoods: [],
      venues: [], orgs: [], hoods: [], tags: []
    };

    this.API_URI = 'http://localhost:3030/importer';
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();

    this.importerService = app.service('importer');
    this.eventsService = app.service('events');
    this.liveServices = {
      'venues': app.service('venues'),
      'orgs': app.service('organizers'),
      'hoods': app.service('neighborhoods'),
      'tags': app.service('tags'),
    };
    this.pendingServices = {
      'pending-events': app.service('pending-events'),
      'pending-venues': app.service('pending-venues'),
      'pending-orgs': app.service('pending-organizers'),
      'pending-hoods': app.service('pending-neighborhoods'),
      'pending-tags': app.service('pending-tags')
    };

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchSchemaListings = this.fetchSchemaListings.bind(this);

    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);

    this.saveListing = this.saveListing.bind(this);
    this.discardListing = this.discardListing.bind(this);

    this.updateMessageList = this.updateMessageList.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.importerService
      .on('status', message => {
        this.updateMessageList(message);
      })
      .on('error', error => {
        this.updateMessageList(error);
      });

    this.pendingServices.forEach((service, key) => {
      service
        .on('created', message => {
          this.updateMessageList({status: 'success', details: `Added ${message.name} with ID #${message.id}`});
          this.fetchSchemaListings(key);
        })
        .on('updated', message => {
          this.props.updateMessageList(message);
          this.fetchSchemaListings(key);
        })
        .on('patched', message => {
          this.updateMessageList({status: 'success', details: `Updated #${message.id} - ${message.name}`});
          this.fetchSchemaListings(key);
        })
        .on('removed', message => {
          this.updateMessageList({
            status: 'success',
            details: `Discarded ${this.schema} #${message.id} - ${message.name}`
          });
          this.fetchSchemaListings(key);
        })
        .on('error', error => {
          this.updateMessageList({status: 'error', details: error.message});
        });
    })

  }

  componentWillUnmount() {
    this.importerService
      .removeListener('status')
      .removeListener('error');

    this.pendingServices.forEach(service => {
      service
        .removeListener('created')
        .removeListener('updated')
        .removeListener('patched')
        .removeListener('removed')
        .removeListener('error');
    });
  }

  fetchAllData() {
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
    // TODO: When importing events, if mapped tag is pending w/ target_id, populate both IDs
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
    // Send custom event do-publish
    console.log('PUBLISH CLICKED');
    this.importerService.emit('publish');
  }

  async queryForSimilar(pendingListing) {
    return this.listingsService.find({
      query: {
        name: pendingListing.name,
        start_date: pendingListing.start_date,
        end_date: pendingListing.end_date
      }
    });
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
          venues={this.state.venues} orgs={this.state.orgs} tags={this.state.tags}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingVenuesModule
          hoods={this.state.hoods}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingOrganizersModule
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <PendingNeighborhoodsModule
          pendingListings={this.pendingHoods}
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          fetchData={this.fetchSchemaListings} saveListing={this.saveListing} discardListing={this.discardListing}
        />
        <PendingTagsModule
          defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessageList} updateColumnSort={this.childUpdateColumnSort}
          updatePageSize={this.childUpdatePageSize} updateCurrentPage={this.childUpdateCurrentPage}
        />
        <button type={'button'} className={'button-primary button-publish'} onClick={this.triggerPublish}>Publish All
          Pending Listings
        </button>
      </div>
    );
  }
};
