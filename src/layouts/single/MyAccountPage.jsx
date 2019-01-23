import React, {Component} from 'react';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import MessagePanel from "../../components/common/MessagePanel";

import "../../styles/account-page.css";

export default class MyAccountPage extends Component {
  constructor(props) {
    super(props);

    this.state = {oldPass: '', newPass: '', messages: [], messagePanelVisible: false};

    this.userService = app.service('users');

    this.updatePassword = this.updatePassword.bind(this);
    this.logout = this.logout.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
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
      email: app.get('user').email,
      password: this.state.oldPass
    }).then(() => {
      this.userService.patch(app.get('user').id, {password: this.state.newPass}).then(() => {
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
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  /**
   * Prepares the message panel for dismissal by removing all messages and setting its visible state to false.
   */
  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
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
        <h2>My Account</h2>
        <MessagePanel messages={this.state.messages} isVisible={this.state.messagePanelVisible} dismissPabel={this.dismissMessagePanel}/>
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
          <button type={'button'} onClick={this.updatePassword}>Update</button>
        </div>
        <div className={'panel danger'} title={'WARNING: ACCOUNT DELETION IS PERMANENT.'}>
          <h3>Delete Account</h3>
          <div className={'button-container'}>
            <button type={'button'} className={'emphasis'}>Delete</button>
            <span>your account.</span>
          </div>
        </div>
      </div>
    );
  }
};
