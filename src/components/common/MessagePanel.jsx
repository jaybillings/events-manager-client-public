import React, {Component} from 'react';

import '../../styles/message-panel.css';

export default class MessagePanel extends Component {
  constructor(props) {
    super(props);

    this.renderMessages = this.renderMessages.bind(this);
  }

  renderMessages() {
    const messages = this.props.messages;

    return messages.map((message, index) =>
      <div className={`message ${message.status}`} key={index}>
        <span className={message.status}>{message.status}</span>
        {JSON.stringify(message.details.message) || JSON.stringify(message.details)}
      </div>
    );
  }

  render() {
    const visibleClass = this.props.isVisible ? 'visible' : 'hidden';

    return (
      <div className={`messageContainer ${visibleClass}`}>
        <button className={'dismiss'} onClick={this.props.dismissPanel}>X</button>
        {this.renderMessages()}
      </div>
    );
  }
};
