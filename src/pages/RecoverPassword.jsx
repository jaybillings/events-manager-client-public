import React, {Component} from 'react';
import app from "../services/socketio";
import {Link} from "react-router-dom";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";

import '../styles/account-form.css';

export default class RecoverPassword extends Component {
  constructor(props) {
    super(props);

    // TODO: Put this in config
    this.senderEmail = 'noreply@visitseattle.org';
    this.helpdeskEmail = 'helpdesk@visitseattle.org';
    this.messagePanelRef = React.createRef();
    this.emailRef = React.createRef();

    this.authManagementService = app.service('authManagement');

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  updateMessagePanel(newMsg) {
    this.messagePanelRef.current.addMessage(newMsg);
  }

  handleSubmit(e) {
    e.preventDefault();

    const email = this.emailRef.current.value;

    if (!email) {
      this.updateMessagePanel({
        status: 'error',
        details: 'Please enter a valid email address.'
      });
      return;
    }

    this.authManagementService.create({
      action: 'sendResetPwd',
      value: {email}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: `Password recovery request submitted. Check your email for a message containing a recovery link. Don't see it? Make sure ${this.senderEmail} is in your spam whitelist.`
        });
      })
      .catch(err => {
        console.error(err);
        this.updateMessagePanel({
          status: 'error',
          details: [<span key={'error-msg'}>Could not send password recovery request. If this continues, please <Link
            to={`mailto:${this.helpdeskEmail}`}>contact the help desk</Link>. Include the following error:</span>,
            <code key={'error-code'}>{JSON.stringify(err)}</code>]
        });
      });
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <h2>Recover Lost Password</h2>
        <MessagePanel ref={this.messagePanelRef} />
        <p className={'single-message'}>Enter your email address. If the address exists in our system, you will shortly
          receive an email containing a recovery link.</p>
        <form onSubmit={this.handleSubmit} className={'account-form'}>
          <label htmlFor={'emailInput'}>Email Address</label>
          <input ref={this.emailRef} id={'emailInput'} type={'email'} defaultValue={''} required />
          <button type={'submit'} className={'button-primary'}>Send Recovery Email</button>
        </form>
      </div>
    );
  }
};
