import React, {Component} from "react";
import app from "../services/socketio";
import fetch from "node-fetch";
import {BeatLoader} from "react-spinners";
import {displayErrorMessages, printToConsole} from "../utilities";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";
import PendingEventsModule from "../components/pendingEvents/PendingEventsModule";
import PendingTagsModule from "../components/pendingTags/PendingTagsModule";
import PendingVenuesModule from "../components/pendingVenues/PendingVenuesModule";
import PendingOrganizersModule from "../components/pendingOrganizers/PendingOrganizersModule";
import PendingNeighborhoodsModule from "../components/pendingNeighborhoods/PendingNeighborhoodsModule";
import ImportXMLForm from "../components/common/ImportXMLForm";


/**
 * `ImportLayout` is a layout component rendering the import view.
 *
 * @class
 */
export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {importRunning: false, publishRunning: false};

    this.API_URI = `http://${process.env.REACT_APP_SERVER_URL}/importer`;
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];
    this.user = app.get('user');

    this.importerService = app.service('importer');

    this.fileInput = React.createRef();
    this.messagePanel = React.createRef();
    this.eventsModule = React.createRef();
    this.venuesModule = React.createRef();
    this.orgsModule = React.createRef();
    this.hoodsModule = React.createRef();
    this.tagsModule = React.createRef();

    this.resumeModuleListening = this.resumeModuleListening.bind(this);
    this.stopModuleListening = this.stopModuleListening.bind(this);

    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  /**
   * Runs after the component mounts. Registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    this.importerService
      .on('status', message => {
        if (message.status === 'success') {
          this.updateMessagePanel({status: 'notice', details: message.message});
          this.resumeModuleListening();
          this.setState({importRunning: false});
        } else if (message.status === 'fail') {
          this.updateMessagePanel({status: 'error', details: message.message});
          this.resumeModuleListening();
          this.setState({importRunning: false});
        } else if (message.status === 'error') {
          printToConsole(message, 'error');
          this.updateMessagePanel({status: 'error', details: message.message});
        } else if (message.status === 'step_success') {
          this.updateMessagePanel({status: 'success', details: message.message})
        } else if (message.status === 'step_start') {
          this.updateMessagePanel({status: 'info', details: message.message});
        }
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   *
   * @override
   */
  componentWillUnmount() {
    this.importerService.removeAllListeners('status');
  }

  /**
   * `resumeModuleListening` resumes data service listening for modules.
   */
  resumeModuleListening() {
    // TODO: Find way to do this that doesn't use refs.
    this.eventsModule.current.startListening();
    this.venuesModule.current.startListening();
    this.orgsModule.current.startListening();
    this.hoodsModule.current.startListening();
    this.tagsModule.current.startListening();
  }

  /**
   * `stopModuleListening` stops service listening for modules.
   */
  stopModuleListening() {
    // TODO: Find way to do this that doesn't use refs.
    this.eventsModule.current.stopListening();
    this.venuesModule.current.stopListening();
    this.orgsModule.current.stopListening();
    this.hoodsModule.current.stopListening();
    this.tagsModule.current.stopListening();
  }

  /**
   * `importData` handles the XML form submit action by triggering data import.
   *
   * @param {Event} e
   */
  importData(e) {
    e.preventDefault();

    let importData = new FormData();

    importData.append('file', this.fileInput.current.files[0]);
    importData.append('filename', this.fileInput.current.files[0].name);

    app.passport.getJWT()
      .then(token => {
        this.setState({importRunning: true});
        this.stopModuleListening();
        return fetch(this.API_URI, {
          method: 'POST',
          body: importData,
          headers: {'Authorization': token}
        });
      })
      .then(response => {
        return response.json(); // Convert raw response body to JSON
      })
      .then(body => {
        if (body.code >= 400) {
          this.updateMessagePanel({status: 'error', details: body.message});
          printToConsole(body);
          this.setState({importRunning: false});
        } else {
          this.updateMessagePanel({status: 'notice', details: 'Importer is running. This may take several minutes.'});
        }
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('data file', 'import', err, this.updateMessagePanel);
        this.setState({importRunning: false});
      });
  }

  /**
   * `publishListings` triggers the publishing of all pending listings, regardless of schema.
   */
  publishListings() {
    this.updateMessagePanel({status: 'info', details: 'Publish started. This make take several minutes.'});
    this.stopModuleListening();
    this.setState({publishRunning: true});

    Promise
      .all([
        this.hoodsModule.current.handlePublishAllClick(),
        this.tagsModule.current.handlePublishAllClick()
      ])
      .then(() => {
        // On its own b/c of high I/O load
        return this.orgsModule.current.handlePublishAllClick();
      })
      .then(() => {
        // On its own b/c of high I/O load
        return this.venuesModule.current.handlePublishAllClick();
      })
      .then(() => {
        // On its own b/c of high I/O load
        return this.eventsModule.current.handlePublishAllClick();
      })
      .then(() => {
        this.updateMessagePanel({status: 'notice', details: 'Publish complete.'});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('publish', 'pending listings', err, this.updateMessagePanel);
      })
      .finally(() => {
        this.setState({publishRunning: false});
        this.resumeModuleListening();
      });
  }

  /**
   * `updateMessagePanel` adds a message to the message panel.
   *
   * @param {Object|Array} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    // TODO: Change label to 'Publish All Listings' or 'Publish Selected Listings' depending on selections
    const spinnerClass = this.state.publishRunning ? ' button-with-spinner' : '';
    const publishButton = this.user.is_su ?
      <button type={'button'} className={`button-primary button-publish${spinnerClass}`} onClick={this.publishListings}>
        Publish Pending Listings
        <BeatLoader size={8} sizeUnit={"px"} color={'#c2edfa'} loading={this.state.publishRunning} />
      </button> : '';

    return (
      <div className="container">
        <Header />
        <MessagePanel ref={this.messagePanel} />
        <h2>Import Data From BeDynamic</h2>
        <ImportXMLForm fileInputRef={this.fileInput} importRunning={this.state.importRunning} handleSubmit={this.importData} />
        <h2>Review Unpublished Data</h2>
        <PendingEventsModule
          ref={this.eventsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessagePanel={this.updateMessagePanel}
        />
        <PendingVenuesModule
          ref={this.venuesModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessagePanel={this.updateMessagePanel}
        />
        <PendingOrganizersModule
          ref={this.orgsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessagePanel={this.updateMessagePanel}
        />
        <PendingNeighborhoodsModule
          ref={this.hoodsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessagePanel={this.updateMessagePanel}
        />
        <PendingTagsModule
          ref={this.tagsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessagePanel={this.updateMessagePanel}
        />
        {publishButton}
      </div>
    );
  }
};
