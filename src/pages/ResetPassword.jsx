import React, {Component} from 'react';
import app from "../services/socketio";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";

import "../styles/account-form.css";

export default class ResetPassword extends Component {
  constructor(props) {
    super(props);

    // TODO: Put this in config
    this.helpdeskEmail = 'helpdesk@visitseattle.org';
    this.passwordRef = React.createRef();
    this.messagePanelRef = React.createRef();

    this.authManagementService = app.service('authManagement');

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  updateMessagePanel(newMsg) {
    this.messagePanelRef.current.addMessage(newMsg);
  }

  handleSubmit(e) {
    e.preventDefault();

    const token = this.props.match.params.token;
    const password = this.passwordRef.current.value;

    if (!password) {
      this.updateMessagePanel({
        status: 'error',
        details: 'Please enter a new password.'
      });
      return;
    }

    this.authManagementService.create({
      action: 'resetPwdLong',
      value: {token, password}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: 'Password changed. You can now log in using your new password.'
        });
      })
      .catch(err => {

        console.error(err);

        let errorMsg = 'Could not reset password.';

        if (err.errors['$className'] === 'resetExpired') errorMsg += ' Recovery token has expired. Please submit another reset request.';
        else errorMsg += 'If this problem continues, please contact the Help Desk.';

        this.updateMessagePanel({
          status: 'error',
          details: errorMsg
        });

      });
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <MessagePanel ref={this.messagePanelRef} />
        <p className={'single-message'}>Enter your new password.</p>
        <form onSubmit={this.handleSubmit} className={'account-form'}>
          <label htmlFor={'passInput'}>New Password</label>
          <input ref={this.passwordRef} id={'passInput'} type={'password'} defaultValue={''} required />
          <button type={'submit'} className={'button-primary'}>Update Password</button>
        </form>
      </div>
    );
  }
};
