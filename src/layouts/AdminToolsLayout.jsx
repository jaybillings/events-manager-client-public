import React, {Component} from 'react';

import Header from '../components/common/Header';
import MessagePanel from "../components/common/MessagePanel";
import ManageUsersModule from "../components/admin/ManageUsersModule";
import ReplaceNeighborhoodsModule from "../components/admin/ReplaceNeighborhoodsModule";
import ReplaceTagsModule from "../components/admin/ReplaceTagsModule";

import '../styles/admin-tools.css';
import '../styles/schema-module.css';
import '../styles/schema-table.css';

export default class AdminToolsLayout extends Component {
  constructor(props) {
    super(props);

    this.defaultPageSize = 5;
    this.messagePanel = React.createRef();

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  render() {
    return (
      <div className="container">
        <Header />
        <MessagePanel ref={this.messagePanel} />
        <h2>Admin Tools</h2>
        <ManageUsersModule updateMessagePanel={this.updateMessagePanel} />
        <ReplaceNeighborhoodsModule updateMessagePanel={this.updateMessagePanel} defaultPageSize={this.defaultPageSize} />
        <ReplaceTagsModule updateMessagePanel={this.updateMessagePanel} defaultPageSize={this.defaultPageSize} />
        <div className={'schema-module'}>
          <h3>Import/Export</h3>
          <a className={'button emphasize'} href={'http://localhost:3030/exporter/json'} target={'_blank'}>Export All Data</a>
          <span> as a JSON file.</span>
        </div>
      </div>
    );
  }
};
