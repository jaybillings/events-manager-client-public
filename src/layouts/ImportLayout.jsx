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

    this.state = {messages: [], messagePanelVisible: false};

    this.API_URI = 'http://localhost:3030/importer';
    this.defaultPageSize = 5;
    this.defaultSortOrder = ['created_at', -1];
    this.user = app.get('user');

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
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  /**
   * Runs after the component mounts. Registers data service listeners.
   * @override
   */
  componentDidMount() {
    this.importerService.on('status', message => {
      this.updateMessagePanel({status: 'info', details: message.details});
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
          this.updateMessagePanel({status: 'error', details: body.message});
        }
      });
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
    // noinspection JSCheckFunctionSignatures
    Promise
      .all([
        this.hoodsModule.current.publishListings(),
        this.tagsModule.current.publishListings(),
        this.orgsModule.current.publishListings()
      ])
      .then(this.venuesModule.current.publishListings())
      .then(this.eventsModule.current.publishListings())
      .catch((err) => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
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
        <h2>Import Data From CSV File</h2>
        <ImportForm fileInputRef={this.fileInput} schemaSelectRef={this.schemaSelect} handleSubmit={this.importData} />
        <h2>Review Unpublished Data</h2>
        <PendingEventsModule
          ref={this.eventsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessagePanel}
        />
        <PendingVenuesModule
          ref={this.venuesModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessagePanel}
        />
        <PendingOrganizersModule
          ref={this.orgsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessagePanel}
        />
        <PendingNeighborhoodsModule
          ref={this.hoodsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessagePanel}
        />
        <PendingTagsModule
          ref={this.tagsModule} defaultPageSize={this.defaultPageSize} defaultSortOrder={this.defaultSortOrder}
          updateMessageList={this.updateMessagePanel}
        />
        {publishButton}
      </div>
    );
  }
};
