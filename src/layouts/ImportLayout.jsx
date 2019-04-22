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

    this.state = {messages: [], messagePanelVisible: false};

    this.fileInput = React.createRef();
    this.eventsModule = React.createRef();
    this.venuesModule = React.createRef();
    this.orgsModule = React.createRef();
    this.hoodsModule = React.createRef();
    this.tagsModule = React.createRef();

    this.importerService = app.service('importer');

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
      .on('created', () => {
        // TODO: On created, start spinner?
        // TODO: Unregister listeners and lazy pull data every second or so?
        this.updateMessagePanel({status: 'info', details: 'Importer is running. This may take several minutes.'});
      })
      .on('status', message => {
        // TODO: If success, import all data?
        this.updateMessagePanel({status: message.status, details: message.details});
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    this.importerService.removeAllListeners('status');
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

    console.log(this.user);

    app.passport.getJWT()
      .then(token => {
        return fetch(this.API_URI, {
          method: 'POST',
          body: importData,
          headers: {'Authorization': token}
        });
      })
      .then(response => {
        return response.json();
      })
      .then(body => {
        if (body.code >= 400) {
          this.updateMessagePanel({status: 'error', details: body.message});
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

    Promise
      .all([
        this.hoodsModule.current.publishListings(),
        this.tagsModule.current.publishListings()
      ])
      .then(() => {
        // On its own b/c of high I/O load
        return this.orgsModule.current.publishListings();
      })
      .then(() => {
        // On its own b/c of high I/O load
        return this.venuesModule.current.publishListings();
      })
      .then(() => {
        // On its own b/c of high I/O load
        return this.eventsModule.current.publishListings();
      })
      .then(() => {
        console.log('~ all done!');
        this.updateMessagePanel({status: 'notice', details: 'Publish complete.'});
      })
      .catch(error => {
        console.log('~ very top level error', error);
        this.updateMessagePanel({status: 'error', details: JSON.stringify(error)});
      });
  }

  /**
   * Updates the message list with a new message and displays the module.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  /**
   * Clears and hides the message panel.
   */
  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  /**
   * Renders the component.
   * @render
   * @returns {*}
   */
  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const publishButton = this.user.is_su ?
      <button type={'button'} className={'button-primary button-publish'} onClick={this.publishListings}>
        Publish All Pending Listings
      </button> : '';

    return (
      <div className="container">
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
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
