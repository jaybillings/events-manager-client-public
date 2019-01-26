import React, {Component} from 'react';

import Header from '../components/common/Header';
import ManageUsersModule from "../components/admin/ManageUsersModule";
import MessagePanel from "../components/common/MessagePanel";


export default class AdminToolsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {messages: [], messagePanelVisible: false};

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  /**
   * Prepares the message panel for dismissal by removing all messages and setting its visible state to false.
   */
  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  render() {
    return (
      <div className="container">
        <Header />
        <MessagePanel messages={this.state.messages} isVisible={this.state.messagePanelVisible}
                      dismissPanel={this.dismissMessagePanel} />
        <h2>Admin Tools</h2>
        <ManageUsersModule updateMessagePanel={this.updateMessagePanel} />
        <h3>Import/Export</h3>
        <a className="button" href={'http://localhost:3030/exporter/json'} target={'_blank'}>Export All Data</a>
        <h3>Create API Buckets</h3>
      </div>
    );
  }
};
