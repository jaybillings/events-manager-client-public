import React, {Component} from 'react';
import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";
import app from "../services/socketio";
import {Redirect} from "react-router";

import "../styles/login-page.css";

/**
 * LoginPage is a component that renders the page responsible for authenticating and creating users.
 */
export default class LoginPage extends Component {
  /**
   * The class's constructor.
   * @param {object} props
   */
  constructor(props) {
    super(props);

    this.state = {email: '', password: '', doRedirect: false, redirectCount: 0, messages: [], messagePanelVisible: false};

    this.authService = app.service('authentication');

    this.logInUser = this.logInUser.bind(this);
    this.createNewUser = this.createNewUser.bind(this);
    this.redirectLoggedIn = this.redirectLoggedIn.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
  }

  componentDidMount() {
    app.passport.getJWT().then(() => {
      this.redirectLoggedIn();
    });
  }

  /**
   * Logs in an existing user.
   */
  logInUser(e) {
    e.preventDefault();

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
        return app.service('users').get(payload.userId);
      })
      .then(user => {
        app.set('user', user);
        console.log('user', app.get('user'));
      })
      .catch(err => {
        this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  /**
   * Creates a new user.
   */
  createNewUser() {
    // TODO: Email/SMS verification
    this.authService.create({
      strategy: 'local',
      email: this.state.email,
      password: this.state.password
    }).then(message => {
      console.log('account creation successful', message);
      this.updateMessagePanel({
        status: 'info',
        message: 'Account created. You can now login using the same credentials.'
      });
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  redirectLoggedIn() {
    const countdown = () => {
      let count = this.state.redirectCount;
      count--;
      console.log('redirect count is', count);
      if (count === 0) {
        this.setState({doRedirect: true});
      } else {
        this.setState({redirectCount: count}, () => {
          setTimeout(countdown, 1000);
        });
      }
    };

    console.log('in redirectlogged in');
    this.setState({redirectCount: 5}, () => {
      setTimeout(countdown, 1000);
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
   *
   * @param {Event} e
   */
  handleInputChange(e) {
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  /**
   * Renders the component.
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const redirectCount = this.state.redirectCount;
    const notifyClass = redirectCount ? '' : ' hidden';
    const timeUnitLabel = redirectCount === 1 ? 'second' : 'seconds';

    if (redirectCount < 1) return <Redirect to={'/import'} />;

    return (
      <div className={'container login-page'}>
        <Header />
        <h2>Log In To Your Account</h2>
        <MessagePanel messages={this.state.messages} isVisible={this.state.messagePanelVisible}
                      dismissPanel={this.dismissMessagePanel} />
        <p className={'login-message' + notifyClass}>Logged in. Redirecting to import page in {this.state.redirectCount} {timeUnitLabel}. </p>
        <form>
          <div className={'input-container'}>
            <label htmlFor={'emailInput'}>Email Address</label>
            <input id={'emailInput'} type={'text'} name={'email'} value={this.state.email} onChange={this.handleInputChange} />
            <label htmlFor={'passInput'}>Password</label>
            <input id={'passInput'} type={'password'} name={'password'} value={this.state.password} onChange={this.handleInputChange} />
          </div>
          <div className={'button-container'}>
            <button type={'button'} onClick={this.createNewUser}>Create Account</button>
            <button className={'button-primary'} type={'button'} onClick={this.logInUser}>Log In</button>
          </div>
        </form>
      </div>
    );
  }
}
