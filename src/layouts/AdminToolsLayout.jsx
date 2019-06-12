import React, {Component} from 'react';
import app from "../services/socketio";

import Header from '../components/common/Header';
import MessagePanel from "../components/common/MessagePanel";
import ManageUsersModule from "../components/admin/ManageUsersModule";
import ReplaceNeighborhoodsModule from "../components/admin/ReplaceNeighborhoodsModule";
import ReplaceTagsModule from "../components/admin/ReplaceTagsModule";

import '../styles/admin-tools.css';
import '../styles/schema-module.css';
import '../styles/schema-table.css';

/**
 * `AdminToolsLayout` lays out the admin tools view.
 */
export default class AdminToolsLayout extends Component {
  constructor(props) {
    super(props);

    this.defaultPageSize = 5;
    this.user = app.get('user');

    this.messagePanel = React.createRef();

    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  /**
   * `updateMessagePanel` adds a message to the message panel.
   *
   * @param {object} newMsg
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
    const userManagementModule = this.user.is_admin ? <ManageUsersModule updateMessagePanel={this.updateMessagePanel} /> : '';
    return (
      <div className="container">
        <Header />
        <MessagePanel ref={this.messagePanel} />
        <h2>Admin Tools</h2>
        {userManagementModule}
        <ReplaceNeighborhoodsModule updateMessagePanel={this.updateMessagePanel}
                                    defaultPageSize={this.defaultPageSize} />
        <ReplaceTagsModule updateMessagePanel={this.updateMessagePanel} defaultPageSize={this.defaultPageSize} />
      </div>
    );
  }
};
