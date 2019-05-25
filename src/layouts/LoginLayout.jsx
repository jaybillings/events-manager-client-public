import React, {Component} from 'react';
import app from "../services/socketio";
import {Redirect} from "react-router-dom";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";
import CreateAccountForm from "../components/login/CreateAccountForm";
import LoginForm from "../components/login/LoginForm";

import "../styles/login-page.css";

/**
 * LoginPage is a component that renders the page responsible for authenticating and creating users.
 */
export default class LoginLayout extends Component {
  constructor(props) {
    super(props);

    this.messagePanelRef = React.createRef();

    this.state = {email: '', password: '', redirectCount: -1, shouldCreateUser: false};

    this.usersService = app.service('users');
    this.authManagementService = app.service('authManagement');

    this.redirectCountdown = this.redirectCountdown.bind(this);

    this.logInUser = this.logInUser.bind(this);
    this.createUser = this.createUser.bind(this);
    this.resendVerifyEmail = this.resendVerifyEmail.bind(this);

    this.toggleLoginState = this.toggleLoginState.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);

    this.renderForm = this.renderForm.bind(this);
  }

  /**
   * Runs once the component mounts. Tries to authenticate the user using the locally stored JWT token. If successful,
   * redirects to the import page.
   * @override
   */
  componentDidMount() {
    app.authenticate()
      .then((login) => {
        app.passport.verifyJWT(login.accessToken)
      })
      .then(() => {
        this.redirectCountdown();
      })
      .catch(err => {
        if (err.code === 401) return;
        console.error(err);
        this.updateMessagePanel({status: 'error', details: 'Error fetching JWT: ' + err.message});
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
  logInUser() {
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
        this.updateMessagePanel({status: 'error', details: 'Authentication error: ' + err.message});
        console.error(err);
      });
  }

  /**
   * Runs when the create user button is clicked. Creates a new user using the supplied credentials.
   *
   * @note For security reasons, user is required to log in manually after account creation.
   */
  createUser() {
    if (!this.state.email || !this.state.password) {
      this.updateMessagePanel({
        status: 'error',
        details: 'A valid email address and password is required to create an account. Please try again.'
      });
      return;
    }

    return this.usersService.create({
      email: this.state.email,
      password: this.state.password,
      permissions: 'user:*'
    });
  }

  resendVerifyEmail() {
    this.authManagementService.create({
      action: 'resendVerifySignup',
      value: {email: this.state.newUser.email}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: `Email has been re-sent. If you still don't see it, make sure ${this.sendAddress} is in your spam whitelist.`
        });
      })
      .create(err => {
        this.props.updateMessagePanel({status: 'error', details: err.message});
      });
  }

  /**
   * Runs when an input is changed. Saves the value to the component's state.
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name || !e.target.value) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  toggleLoginState() {
    this.setState((prevState) => {
      return {shouldCreateUser: !prevState.shouldCreateUser}
    });
  }

  /**
   * Adds a message to the message panel.
   *
   * @param {object} newMsg
   */
  updateMessagePanel(newMsg) {
    this.messagePanelRef.current.addMessage(newMsg);
  }

  renderForm() {
    if (this.state.shouldCreateUser) {
      return <CreateAccountForm
        email={this.state.email} password={this.state.password}
        createUser={this.createUser} resendVerifyEmail={this.resendVerifyEmail}
        handleInputChange={this.handleInputChange} toggleLoginState={this.toggleLoginState}
        updateMessagePanel={this.updateMessagePanel}
      />;
    }

    return <LoginForm
      email={this.state.email} password={this.state.password}
      logInUser={this.logInUser} handleInputChange={this.handleInputChange}
      toggleLoginState={this.toggleLoginState}
    />;
  }

  render() {
    // TODO: Fill in missing password functionality
    const redirectCount = this.state.redirectCount;
    const successMsgClass = redirectCount > 0 ? '' : ' hidden';
    const warningMsgClass = redirectCount === -1 ? '' : ' hidden';
    const redirectTarget = this.props.match.params.redirectUrl || 'import';
    const title = this.state.shouldCreateUser ? 'create new account' : 'log in to your account';

    if (redirectCount === 0) return <Redirect to={`/${redirectTarget}`} />;

    return (
      <div className={'container login-page'}>
        <Header />
        <h2>{title}</h2>
        <MessagePanel ref={this.messagePanelRef} />
        <p className={'message success-message' + successMsgClass}>Logged in. Redirecting in {this.state.redirectCount}
          {redirectCount === 1 ? ' second' : ' seconds'}. </p>
        <p className={'message warning-message' + warningMsgClass}>You must log in to continue.</p>
        {this.renderForm()}
      </div>
    );
  }
}
