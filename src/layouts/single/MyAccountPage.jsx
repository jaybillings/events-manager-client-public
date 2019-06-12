import React, {Component} from 'react';
import pwRules from "password-rules";
import app from "../../services/socketio";
import {BeatLoader} from 'react-spinners';
import {displayErrorMessages, printToConsole} from "../../utilities";

import Header from "../../components/common/Header";
import MessagePanel from "../../components/common/MessagePanel";

import "../../styles/account-page.css";

/**
 * MyAccountPage renders the user account page.
 *
 * @class
 */
export default class MyAccountPage extends Component {
  constructor(props) {
    super(props);

    this.state = {updateRunning: false};

    this.user = app.get('user');
    this.authManagementService = app.service('authManagement');

    this.messagePanel = React.createRef();
    this.oldPassRef = React.createRef();
    this.newPassRef = React.createRef();

    this.handlePasswordUpdate = this.handlePasswordUpdate.bind(this);
    this.resendVerifyEmail = this.resendVerifyEmail.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);

    this.renderResendBlock = this.renderResendBlock.bind(this);
  }

  /**
   * Updates the logged-in user's password.
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

    const pwRulesRes = pwRules(password);
    if (pwRulesRes) {
      this.updateMessagePanel({
        status: 'error',
        details: pwRulesRes.sentence.slice(0, -1)
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
      .then(() => {
        this.updateMessagePanel({status: 'success', details: 'Your password has been changed successfully.'});
        this.oldPassRef.current.value = '';
        this.newPassRef.current.value = '';
      })
      .catch(err => {
        displayErrorMessages('update', 'password', err, this.updateMessagePanel);
        printToConsole(err, 'error');
      })
      .finally(() => this.setState({updateRunning: false}));
  }

  /**
   * Handles re-sending the verification email.
   */
  resendVerifyEmail() {
    this.authManagementService.create({
      action: 'resendVerifySignup',
      value: {email: this.user.email}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: `Verification email has been re-sent. If you still don't see it, make sure ${process.env.REACT_APP_HELP_ADDRESS} is in your spam whitelist.`
        });
      })
      .catch(err => {
        displayErrorMessages('resend', 'verification email', err, this.updateMessagePanel);
        printToConsole(err, 'error');
      });
  }

  /**
   * Handles logging out of the user account.
   */
  logoutAccount() {
    app.set('user', null);
    app.logout().catch(err => {
      printToConsole(err, 'error');
    });
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanel.current.addMessage(newMsg);
  }

  /**
   * Renders the 'resend email verification' button and message.
   *
   * @returns {*}
   */
  renderResendBlock() {
    if (this.user.isVerified) return;

    return <div className={'verification-message'}>
      <button type={'button'} className={'default'} onClick={this.resendVerifyEmail}>Resend Account Verification Email
      </button>
      <span>Your email address has not been verified. Account functions are limited.</span>
    </div>;
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const spinnerClass = this.state.updateRunning ? ' button-with-spinner' : '';

    return (
      <div className="container account-page">
        <Header />
        <h2>{this.user.email}'s Account</h2>
        <MessagePanel ref={this.messagePanel} />

        <div className={'button-container'}>
          <button type={'button'} className={'button-primary emphasis'} onClick={this.logoutAccount}>Log Out</button>
          <span>of your account.</span>
        </div>

        {this.renderResendBlock()}

        <div className={'panel'}>
          <h3>Update Password</h3>
          <div className={'single-message'}>Passwords must be at least 8 letters long, contain a capital letter, and contain a number.</div>
          <form onSubmit={this.handlePasswordUpdate}>
            <div className={'input-container'}>
              <label htmlFor={'oldPass'}>Old Password</label>
              <input type={'password'} id={'oldPass'} ref={this.oldPassRef} defaultValue={''} required />
              <label htmlFor={'newPass'}>New Password</label>
              <input type={'password'} id={'newPass'} ref={this.newPassRef} defaultValue={''} required />
            </div>
            <button type={'button'} className={`default${spinnerClass}`} onClick={this.handlePasswordUpdate}>
              Update Password
              <BeatLoader size={8} sizeUnit={"px"} color={'#777'} loading={this.state.updateRunning} />
            </button>
          </form>
        </div>
      </div>
    );
  }
};
