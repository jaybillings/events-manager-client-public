import React, {Component} from 'react';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import MessagePanel from "../../components/common/MessagePanel";

import "../../styles/account-page.css";

export default class MyAccountPage extends Component {
  constructor(props) {
    super(props);

    this.user = app.get('user');
    this.sendAddress = 'noreply@visitseattle.org';

    this.state = {updateRunning: false};

    this.messagePanel = React.createRef();
    this.oldPassRef = React.createRef();
    this.newPassRef = React.createRef();

    this.authManagementService = app.service('authManagement');

    this.handlePasswordUpdate = this.handlePasswordUpdate.bind(this);
    this.resendVerifyEmail = this.resendVerifyEmail.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);

    this.renderResendEmailButton = this.renderResendEmailButton.bind(this);

    console.debug(app.get('user'));
  }

  /**
   * Updates the logged-in user's password. Re-verifies old password before proceeding.
   */
  handlePasswordUpdate() {
    const oldPassword = this.oldPassRef.current.value;
    const password = this.newPassRef.current.value;

    if (!oldPassword || !password) {
      this.updateMessagePanel({
        status: 'error',
        details: 'To update your password, you must enter both your old and new passwords.'
      });
      return;
    }

    this.setState({updateRunning: true});

    this.authManagementService.create({
      action: 'passwordChange',
      value: {
        user: {email: this.user.email},
        oldPassword,
        password
      }
    })
      .then(result => {
        console.debug('password change result', result);
        this.updateMessagePanel({status: 'success', details: 'Your password has been changed successfully.'});
        this.oldPassRef.current.value = '';
        this.newPassRef.current.value = '';
      })
      .catch(err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      })
      .finally(() => this.setState({updateRunning: false}));
  }

  resendVerifyEmail() {
    this.authManagementService.create({
      action: 'resendVerifySignup',
      value: {email: this.user.email}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: `Verification email has been re-sent. If you still don't see it, make sure ${this.sendAddress} is in your spam whitelist.`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: err.message});
      });
  }

  logout() {
    app.set('user', null);
    app.logout();
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  renderResendEmailButton() {
    if (this.user.isVerified) return;

    return <div className={'verification-message'}>
      <button type={'button'} className={'default'} onClick={this.resendVerifyEmail}>Resend Account Verification Email</button>
      <span>Your email address has not been verified. Account functions are limited.</span>
    </div>;
  }

  render() {
    const spinnerClass = this.state.updateRunning ? ' button-with-spinner' : '';
    return (
      <div className="container account-page">
        <Header />
        <h2>{this.user.email}'s Account</h2>

        <MessagePanel ref={this.messagePanel} />
        <div className={'button-container'}>
          <button type={'button'} className={'button-primary emphasis'} onClick={this.logout}>Log Out</button>
          <span>of your account.</span>
        </div>
        {this.renderResendEmailButton()}
        <div className={'panel'}>
          <h3>Update Password</h3>
          <form onSubmit={this.handlePasswordUpdate}>
            <div className={'input-container'}>
              <label htmlFor={'oldPass'}>Old Password</label>
              <input type={'password'} id={'oldPass'} ref={this.oldPassRef} defaultValue={''} required />
              <label htmlFor={'newPass'}>New Password</label>
              <input type={'password'} id={'newPass'} ref={this.newPassRef} defaultValue={''} required />
            </div>
            <button type={'button'} className={`default${spinnerClass}`} onClick={this.handlePasswordUpdate}>Update</button>
          </form>
        </div>
      </div>
    );
  }
};
