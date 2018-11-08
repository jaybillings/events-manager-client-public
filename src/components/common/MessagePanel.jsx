import React, {Component} from 'react';

import "../../styles/message-panel.css";

export default class MessagePanel extends Component {
  constructor(props) {
    super(props);

    this.renderMessages = this.renderMessages.bind(this);
  }

  renderMessages() {
    const messages = this.props.messages;

    return messages.map((message, index) =>
      <li className={`message ${message.status}`} key={index}>
        <span className={message.status}>{message.status}</span>
        {message.details.message || message.details}
      </li>
    );
  }

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
