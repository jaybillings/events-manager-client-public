import React, {Component} from "react";
import app from "../services/socketio";
import fetch from "node-fetch";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";
import PendingEventsModule from "../components/pendingEvents/PendingEventsModule";
import PendingTagsModule from "../components/pendingTags/PendingTagsModule";
import PendingVenuesModule from "../components/pendingVenues/PendingVenuesModule";
import PendingOrganizersModule from "../components/pendingOrganizers/PendingOrganizersModule";
import PendingNeighborhoodsModule from "../components/pendingNeighborhoods/PendingNeighborhoodsModule";
import ImportXMLForm from "../components/common/ImportXMLForm";

/**
 * The ImportLayout component lays out the page that handles importing and processing external data.
 * @class
 */
export default class ImportLayout extends Component {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.API_URI = 'http://localhost:3030/importer';
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];
    this.user = app.get('user');

    this.fileInput = React.createRef();
    this.messagePanel = React.createRef();
    this.eventsModule = React.createRef();
    this.venuesModule = React.createRef();
    this.orgsModule = React.createRef();
    this.hoodsModule = React.createRef();
    this.tagsModule = React.createRef();

    this.importerService = app.service('importer');

    this.resumeModuleListening = this.resumeModuleListening.bind(this);
    this.stopModuleListening = this.stopModuleListening.bind(this);

    this.importData = this.importData.bind(this);
    this.publishListings = this.publishListings.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  /**
   * Runs after the component mounts. Registers data service listeners.
   * @override
   */
  componentDidMount() {
    this.importerService
      .on('status', message => {
        if (message.status === 'success') {
          this.updateMessagePanel({status: 'success', details: message.message});
          this.resumeModuleListening();
        } else if (message.status === 'fail') {
          this.updateMessagePanel({status: 'error', details: message.message});
          this.resumeModuleListening();
        } else if (message.status === 'error') {
          console.debug('[COE] Error occurred while importing');
          console.error(message.rawError || 'No raw error');
          this.updateMessagePanel({status: 'error', details: message.message});
        } else if (message.status === 'status') {
          this.updateMessagePanel({status: 'info', details: message.message})
        }
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.importerService.removeAllListeners('status');
  }

  resumeModuleListening() {
    console.info('START module listening');
    this.eventsModule.current.startListening();
    this.venuesModule.current.startListening();
    this.orgsModule.current.startListening();
    this.hoodsModule.current.startListening();
    this.tagsModule.current.startListening();
  }

  stopModuleListening() {
    console.debug('STOP module listening');
    this.eventsModule.current.stopListening();
    this.venuesModule.current.stopListening();
    this.orgsModule.current.stopListening();
    this.hoodsModule.current.stopListening();
    this.tagsModule.current.stopListening();
  }

  /**
   * Handles the importing of a single CSV file containing listings of a given schema. Parameters are
   * retrieved from from DOM.
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
          console.error(body.message);
        } else {
          this.updateMessagePanel({status: 'info', details: 'Importer is running. This may take several minutes.'});
        }
      });
  }

  /**
   * Triggers the publishing of all listings on the import page.
   *
   * @note Unlike when publishing listings manually, publishListings publishes them in the correct order to prevent
   * missing linked schema. It also stops on the first error encountered. It may be preferred over manually publishing
   * large datasets.
   */
  publishListings() {
    this.updateMessagePanel({status: 'info', details: 'Publish started. This make take several minutes.'});
    this.stopModuleListening();

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
        console.log('~ all done!');
        this.updateMessagePanel({status: 'notice', details: 'Publish complete.'});
      })
      .catch(error => {
        console.log('~ very top level error', error);
        this.updateMessagePanel({status: 'error', details: JSON.stringify(error)});
      })
      .finally(() => {
        this.resumeModuleListening();
      });
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  /**
   * Renders the component.
   * @render
   * @returns {*}
   */
  render() {
    // TODO: All/Selected depending on selections
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary button-publish'} onClick={this.publishListings}>
        Publish Pending Listings
      </button> : '';

    return (
      <div className="container">
        <Header />
        <MessagePanel ref={this.messagePanel} />
        <h2>Import Data From BeDynamic</h2>
        <ImportXMLForm fileInputRef={this.fileInput} handleImportClick={this.importData} />
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
