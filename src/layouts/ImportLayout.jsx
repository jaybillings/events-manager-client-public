import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import ImportForm from '../components/importer/ImportForm';
import MessagePanel from '../components/common/MessagePanel';

export default class ImportLayout extends Component {
  constructor(props) {
    super(props);

    this.importerService = app.service('importer');
    this.pendingEventsService = app.service('pending-events');
    this.fileInput = React.createRef();

    this.state = {
      messages: [],
      messagePanelVisible: false
    };

    this.importData = this.importData.bind(this);
    this.dismissMessagesPanel = this.dismissMessagesPanel.bind(this);
  }

  componentDidMount() {
    // Register listeners
    this.importerService
      .on('status', message => {
        console.log('importer status ', message);
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([message]),
          messagePanelVisible: true
        });
      })
      .on('error', error => {
        console.log('importer error ', error);
        let messageList = this.state.messages;
        this.setState({
          messages: messageList.concat([{status: 'error', details: error.message}]),
          messagePanelVisible: true
        });
      });

    this.pendingEventsService
      .on('error', error => {
        console.log('pending-events created ', error);
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

    this.pendingEventsService.removeListener('error');
  }

  importData(e) {
    // TODO: Handle multiple files
    e.preventDefault();
    console.log('in importdata');
    //const fileToImport = this.fileInput.current.files[0];
    let importData = new FormData();
    importData.append('file', this.fileInput.current.files[0]);
    importData.append('filename', this.fileInput.current.files[0].name);

    fetch('http://localhost:3030/importer', {
      method: 'POST',
      body: importData
    }).then((response) => {
      response.json().then((body) => {
        // TODO: Print result to messages, if error
        console.log(body);
        if (body.code >= 400) {
          this.setState(prevState => ({
            messages: [...prevState.messages, {status: 'error', details: body.message}],
            messagePanelVisible: true
          }));
        }
      });
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
        <h2>Import</h2>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagesPanel} />
        <h3>Import Data From File</h3>
        <ImportForm fileInputRef={this.fileInput} handleSubmit={this.importData} />
        <h3>Review Unpublished Data</h3>
        <h3>Publish</h3>
      </div>
    );
  }
};
