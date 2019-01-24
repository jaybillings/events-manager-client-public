import React, {Component} from 'react';
import app from "../services/socketio";
import {Redirect} from "react-router";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";

import "../styles/login-page.css";

/**
 * LoginPage is a component that renders the page responsible for authenticating and creating users.
 */
export default class LoginPage extends Component {
  constructor(props) {
    super(props);

    this.state = {email: '', password: '', redirectCount: -1, messages: [], messagePanelVisible: false};

    this.usersService = app.service('users');

    this.redirectCountdown = this.redirectCountdown.bind(this);
    this.handleFormLogin = this.handleFormLogin.bind(this);
    this.handleUserCreate = this.handleUserCreate.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  /**
   * Runs once the component mounts. Tries to authenticate the user using the locally stored JWT token. If successful,
   * redirects to the import page.
   * @override
   */
  componentDidMount() {
    app.authenticate().then(() => {
      this.redirectCountdown();
    });
  }

  /**
   * Redirects the user to the import page after a countdown is finished.
   *
   * @note The countdown helps prevent infinite redirects and gives the user time to comprehend the redirection.
   */
  redirectCountdown() {
    const countdown = () => {
      let count = this.state.redirectCount - 1;

      this.setState({redirectCount: count});

      if (count > 0) {
        setTimeout(countdown, 1000);
      }
    };

    this.setState({redirectCount: 5}, () => {
      setTimeout(countdown, 1000);
    });
  }

  /**
   * Runs when the login button is clicked. Logs in an existing user using the credentials supplied in the login form.
   * Verifies user data and sets the app's user parameter.
   */
  handleFormLogin() {
    app
      .authenticate({
        strategy: 'local',
        email: this.state.email,
        password: this.state.password
      })
      .then(message => {
        console.log('authenticated!');
        return app.passport.verifyJWT(message.accessToken);
      })
      .then(payload => {
        console.log('JWT payload', payload);
        return this.usersService.get(payload.userId);
      })
      .then(user => {
        app.set('user', user);
        console.log('user', app.get('user'));
        this.setState({redirectCount: 0});
      })
      .catch(err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  /**
   * Runs when the create user button is clicked. Creates a new user using the supplied credentials.
   *
   * @note For security reasons, user is required to log in manually after account creation.
   */
  handleUserCreate() {
    // TODO: Email/SMS verification
    this.usersService.create({
      email: this.state.email,
      password: this.state.password
    }).then(() => {
      this.updateMessagePanel({
        status: 'info',
        details: 'Account created. You can now login using the same credentials.'
      });
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      console.log('account create error');
    });
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
    const redirectCount = this.state.redirectCount;
    const successMsgClass = redirectCount > 0 ? '' : ' hidden';
    const warningMsgClass = redirectCount === -1 ? '' : ' hidden';

    if (redirectCount === 0) return <Redirect to={'/import'} />;

    return (
      <div className={'container login-page'}>
        <Header />
        <h2>Log In To Your Account</h2>
        <MessagePanel messages={this.state.messages} isVisible={this.state.messagePanelVisible}
                      dismissPanel={this.dismissMessagePanel} />
        <p className={'message success-message' + successMsgClass}>Logged in. Redirecting to import page
          in {this.state.redirectCount} {redirectCount === 1 ? 'second' : 'seconds'}. </p>
        <p className={'message warning-message' + warningMsgClass}>You must log in to continue.</p>
        <form>
          <div className={'input-container'}>
            <label htmlFor={'emailInput'}>Email Address</label>
            <input id={'emailInput'} type={'text'} name={'email'} value={this.state.email}
                   onChange={this.handleInputChange} />
            <label htmlFor={'passInput'}>Password</label>
            <input id={'passInput'} type={'password'} name={'password'} value={this.state.password}
                   onChange={this.handleInputChange} />
          </div>
          <div className={'button-container'}>
            <button type={'button'} onClick={this.handleUserCreate}>Create Account</button>
            <button className={'button-primary'} type={'button'} onClick={this.handleFormLogin}>Log In</button>
          </div>
        </form>
      </div>
    );
  }
}
