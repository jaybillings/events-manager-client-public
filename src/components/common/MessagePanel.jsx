import React, {Component} from 'react';
import {MdClose} from "react-icons/md";

import "../../styles/message-panel.css";

/**
 * MessagePanel displays a list of informational messages to the user.
 *
 * @class
 */
export default class MessagePanel extends Component {
  constructor(props) {
    super(props);

    this.state = {isVisible: false, messages: [], timeoutID: null};

    this.maxVisibleSeconds = 45000;

    this.addMessage = this.addMessage.bind(this);
    this.dismissPanel = this.dismissPanel.bind(this);
    this.renderMessages = this.renderMessages.bind(this);
  }

  /**
   * Runs when the component mounts. Clears the hide timeout.
   */
  componentWillUnmount() {
    if (this.state.timeoutID) window.clearTimeout(this.state.timeoutID);
  }

  /**
   * Adds a new message to the panel and re-starts the hide timeout.
   *
   * @param {string} newMsg
   */
  addMessage(newMsg) {
    if (this.state.timeoutID) window.clearTimeout(this.state.timeoutID);
    const timeoutID = window.setTimeout(this.dismissPanel, this.maxVisibleSeconds);

    this.setState(prevState => {
      return {messages: [newMsg, ...prevState.messages], isVisible: true, timeoutID};
    });
  }

  /**
   * Hides the panel.
   */
  dismissPanel() {
    this.setState({isVisible: false, messages: [], timeoutID: null})
  }

  /**
   * Renders the list of messages.
   *
   * @returns {*[]}
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
   * @override
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
