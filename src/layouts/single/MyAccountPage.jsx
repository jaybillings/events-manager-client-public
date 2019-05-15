import React, {Component} from 'react';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import MessagePanel from "../../components/common/MessagePanel";

import "../../styles/account-page.css";

export default class MyAccountPage extends Component {
  constructor(props) {
    super(props);

    this.messagePanel = React.createRef();

    this.state = {oldPass: '', newPass: ''};

    this.user = app.get('user');
    this.userService = app.service('users');

    this.updatePassword = this.updatePassword.bind(this);
    this.logout = this.logout.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  /**
   * Updates the logged-in user's password. Re-verifies old password before proceeding.
   */
  updatePassword() {
    if (!(this.state.oldPass && this.state.newPass)) {
      this.updateMessagePanel({status: 'error', details: 'To update your password, both Old Password and New Password must not be blank'});
      return;
    }

    app.authenticate({
      strategy: 'local',
      email: this.user.email,
      password: this.state.oldPass
    }).then(() => {
      this.userService.patch(this.user.id, {password: this.state.newPass}).then(() => {
        this.updateMessagePanel({status: 'success', details: 'Your password has been changed successfully.'});
      });
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  logout() {
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

  /**
   * Runs when an input is changed. Saves the value to the component's state.
   * @param {Event} e
   */
  handleInputChange(e) {
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  render() {
    return (
      <div className="container account-page">
        <Header />
        <h2>{this.user.email}'s Account</h2>
        <MessagePanel ref={this.messagePanel} />
        <div className={'button-container'}>
          <button type={'button'} className={'button-primary emphasis'} onClick={this.logout}>Log Out</button>
          <span>of your account.</span>
        </div>
        <div className={'panel'}>
          <h3>Update Password</h3>
          <div className={'input-container'}>
            <label htmlFor={'oldPass'}>Old Password</label>
            <input type={'password'} id={'oldPass'} name={'oldPass'} onChange={this.handleInputChange} required />
            <label htmlFor={'newPass'}>New Password</label>
            <input type={'password'} id={'newPass'} name={'newPass'} onChange={this.handleInputChange} required />
          </div>
          <button type={'button'} className={'default'} onClick={this.updatePassword}>Update</button>
        </div>
        <div className={'panel danger'} title={'WARNING: ACCOUNT DELETION IS PERMANENT.'}>
          <h3>Delete Account</h3>
          <div className={'button-container'}>
            <button type={'button'} className={'warn more'}>Delete</button>
            <span>your account.</span>
          </div>
        </div>
      </div>
    );
  }
};
