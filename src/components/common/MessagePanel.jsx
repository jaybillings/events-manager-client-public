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
   */
  constructor(props) {
    super(props);

    this.maxVisibleSeconds = 1000 * 30;

    this.state = {isVisible: false, messages: [], timeoutID: null};

    this.dismissPanel = this.dismissPanel.bind(this);
    this.addMessage = this.addMessage.bind(this);
    this.renderMessages = this.renderMessages.bind(this);
  }

  componentWillUnmount() {
    if (this.state.timeoutID) window.clearTimeout(this.state.timeoutID);
  }

  dismissPanel() {
    this.setState({isVisible: false, messages: [], timeoutID: null})
  }

  addMessage(newMsg) {
    if (this.state.timeoutID) window.clearTimeout(this.state.timeoutID);
    const timeoutID = window.setTimeout(this.dismissPanel, this.maxVisibleSeconds);

    this.setState(prevState => {
      return {messages: [newMsg, ...prevState.messages], isVisible: true, timeoutID};
    });
  }

  /**
   * Renders the list of messages.
   * @render
   * @override
   *
   * @returns {*}
   */
  renderMessages() {
    const messages = this.state.messages;

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
    const visibleClass = this.state.isVisible ? 'visible' : 'hidden';

    return (
      <div className={`messageContainer ${visibleClass}`}>
        <header>
          <h3>Messages</h3>
          <button className={'dismiss'} onClick={this.dismissPanel}><MdClose /></button>
        </header>
        <div><ul>{this.renderMessages()}</ul></div>
      </div>
    );
  }
};
