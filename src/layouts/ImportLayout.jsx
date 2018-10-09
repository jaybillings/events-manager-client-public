import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import ImportForm from '../components/importer/ImportForm';
import MessagePanel from '../components/common/MessagePanel';
import PendingEventsModule from '../components/pendingEvents/PendingEventsModule';
import PendingTagsModule from '../components/pendingTags/PendingTagsModule';

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
    };

    this.fileInput = React.createRef();
    this.schemaSelect = React.createRef();
    this.API_URI = 'http://localhost:3030/importer';
    this.importerService = app.service('importer');

    this.importData = this.importData.bind(this);
    this.dismissMessagesPanel = this.dismissMessagesPanel.bind(this);
  }

  componentDidMount() {
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
        <PendingEventsModule updateMessageList={this.updateMessageList} />
        {/*<PendingVenuesModule updateMessageList={this.updateMessageList} />
        <PendingOrganizersModule updateMessageList={this.updateMessageList} />
        <PendingNeighborhoodsModule updateMessageList={this.updateMessageList} />*/}
        <h3>Tags</h3>
        <PendingTagsModule updateMessageList={this.updateMessageList} />
        <h2>Publish</h2>
      </div>
    );
  }
};
