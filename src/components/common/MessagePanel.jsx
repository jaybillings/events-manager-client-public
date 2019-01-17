import React, {Component} from 'react';

import "../../styles/message-panel.css";

/**
 * The MessagePanel component displays a list of informational messages to the user.
 *
 * @class
 */
export default class MessagePanel extends Component {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.renderMessages = this.renderMessages.bind(this);
  }

  /**
   * Renders the list of messages.
   *
   * @returns {*}
   */
  renderMessages() {
    const messages = this.props.messages;

    return messages.map((message, index) =>
      <li className={`message ${message.status}`} key={index}>
        <span className={message.status}>{message.status}</span>
        {message.details.message || message.details}
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
        <h3>Messages</h3>
        <button className={'dismiss'} onClick={this.props.dismissPanel}>X</button>
        <ul>{this.renderMessages()}</ul>
      </div>
    );
  }
};
