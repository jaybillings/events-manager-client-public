import React, {Component} from 'react';
import {MdClose} from "react-icons/md";

import "../../styles/message-panel.css";

/**
 * The MessagePanel component displays a list of informational messages to the user.
 *
 * @class
 */
export default class MessagePanel extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{messages: Array, isVisible: Boolean, dismissPanel: Function}} props
   */
  constructor(props) {
    super(props);

    this.renderMessages = this.renderMessages.bind(this);
  }

  /**
   * Renders the list of messages.
   * @render
   * @override
   *
   * @returns {*}
   */
  renderMessages() {
    const messages = this.props.messages;

    return messages.map((message, index) =>
      <li className={`message ${message.status}`} key={index}>
        <span className={message.status}><strong>{message.status}</strong></span>
        {message.details || JSON.stringify(message)}
      </li>
    );
  }

  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const visibleClass = this.props.isVisible ? 'visible' : 'hidden';

    return (
      <div className={`messageContainer ${visibleClass}`}>
        <header>
          <h3>Messages</h3>
          <button className={'dismiss'} onClick={this.props.dismissPanel}><MdClose /></button>
        </header>
        <div><ul>{this.renderMessages()}</ul></div>
      </div>
    );
  }
};
