import React, {Component} from 'react';

import Header from '../components/common/Header';
import MessagePanel from "../components/common/MessagePanel";
import ManageUsersModule from "../components/admin/ManageUsersModule";
import ReplaceNeighborhoodsModule from "../components/admin/ReplaceNeighborhoodsModule";
import ReplaceTagsModule from "../components/admin/ReplaceTagsModule";

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
        <ReplaceNeighborhoodsModule updateMessagePanel={this.updateMessagePanel} />
        <ReplaceTagsModule updateMessagePanel={this.updateMessagePanel} />
        <div className={'schema-module'}>
          <h3>Import/Export</h3>
          <a className={'button emphasize'} href={'http://localhost:3030/exporter/json'} target={'_blank'}>Export All Data</a>
          <span> as a JSON file.</span>
        </div>
      </div>
    );
  }
};
