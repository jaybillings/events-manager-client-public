import React, {Component} from 'react';
import pwRules from "password-rules";
import app from "../services/socketio";
import {Redirect} from "react-router-dom";

import Header from "../components/common/Header";
import MessagePanel from "../components/common/MessagePanel";
import CreateAccountForm from "../components/login/CreateAccountForm";
import LoginForm from "../components/login/LoginForm";

import "../styles/login-page.css";
import {displayErrorMessages, printToConsole} from "../utilities";

/**
 * LoginLayout renders the layout for the login page.
 */
export default class LoginLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {email: '', password: '', redirectCount: -1, shouldCreateUser: false};

    this.countdownTimeout = 1000;
    this.usersService = app.service('users');
    this.authManagementService = app.service('authManagement');

    this.messagePanelRef = React.createRef();

    this.logInUser = this.logInUser.bind(this);
    this.createUser = this.createUser.bind(this);

    this.resendVerifyEmail = this.resendVerifyEmail.bind(this);

    this.redirectCountdown = this.redirectCountdown.bind(this);
    this.toggleLoginState = this.toggleLoginState.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    this.updateMessagePanel = this.updateMessagePanel.bind(this);

    this.renderForm = this.renderForm.bind(this);
  }

  /**
   * Runs once the component mounts. Tries to authenticate the user using the locally stored JWT token. If successful,
   * redirects to the import page.
   *
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
        printToConsole(err, 'error');
        displayErrorMessages('log in', 'user', err, this.updateMessagePanel);
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
        printToConsole('authenticated', 'log');
        return app.passport.verifyJWT(message.accessToken);
      })
      .then(payload => {
        return this.usersService.get(payload.userId);
      })
      .then(user => {
        app.set('user', user);
        this.setState({redirectCount: 0});
      })
      .catch(err => {
        printToConsole(err, 'error');
        displayErrorMessages('log in', 'user', err, this.updateMessagePanel);
      });
  }

  /**
   * Runs when the create user button is clicked. Creates a new user using the supplied credentials.
   *
   * @async
   * @note For security reasons, user is required to log in manually after account creation.
   */
  createUser() {
    if (!this.state.email || !this.state.password) {
      return Promise.reject({message: 'A valid email address and password is required to create an account. Please try again.'});
    }

    const pwRulesRes = pwRules(this.state.password);
    if (pwRulesRes) {
      return Promise.reject({message: pwRulesRes.sentence.slice(0, -1)});
    }

    return this.usersService.create({
      email: this.state.email,
      password: this.state.password,
      permissions: 'user:*'
    });
  }

  /**
   * Runs when the 'resend verification email' button is clicked. Triggers a server call to resend the email.
   */
  resendVerifyEmail(newUser) {
    this.authManagementService.create({
      action: 'resendVerifySignup',
      value: {email: newUser.email}
    })
      .then(() => {
        this.updateMessagePanel({
          status: 'success',
          details: `Email has been re-sent. If you still don't see it, make sure ${process.env.REACT_APP_SEND_ADDRESS} is in your spam whitelist.`
        });
      })
      .catch(err => {
        displayErrorMessages('create', 'new user', err, this.updateMessagePanel);
        printToConsole(err, 'error');
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

      this.setState({redirectCount: count}, () => {
        if (count > 0) {
          setTimeout(countdown, this.countdownTimeout);
        }
      });
    };

    this.setState({redirectCount: 5}, () => {
      setTimeout(countdown, this.countdownTimeout);
    });
  }

  /**
   * Runs when an input is changed. Saves the value to the component's state.
   *
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name || !e.target.value) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  /**
   * Swaps the view's state between login and user creation.
   */
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

  /**
   * Renders the user creation or login form, depending on what is required by the state.
   *
   * @returns {*}
   */
  renderForm() {
    if (this.state.shouldCreateUser) {
      return [
        <span className={'message single-message'}>Passwords must be at least 8 letters long, contain a capital letter, and contain a number.</span>,
        <CreateAccountForm
          email={this.state.email} password={this.state.password}
          createUser={this.createUser} resendVerifyEmail={this.resendVerifyEmail}
          handleInputChange={this.handleInputChange} toggleLoginState={this.toggleLoginState}
          updateMessagePanel={this.updateMessagePanel}
        />
      ];
    }

    const hideWarningClass = this.state.redirectCount === -1 ? '' : ' hidden';
    return [
      <p className={'message single-message warning-message' + hideWarningClass}>You must log in to continue.</p>,
      <LoginForm
        email={this.state.email} password={this.state.password}
        logInUser={this.logInUser} handleInputChange={this.handleInputChange}
        toggleLoginState={this.toggleLoginState}
      />
    ];
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const redirectCount = this.state.redirectCount;
    const hideSuccessClass = redirectCount > 0 ? '' : ' hidden';
    const redirectTarget = this.props.match.params.redirectUrl || 'import';
    const title = this.state.shouldCreateUser ? 'create new account' : 'log in to your account';

    if (redirectCount === 0) return <Redirect to={`/${redirectTarget}`} />;

    return (
      <div className={'container login-page'}>
        <Header />
        <h2>{title}</h2>
        <MessagePanel ref={this.messagePanelRef} />
        <p className={'message success-message' + hideSuccessClass}>Logged in. Redirecting in {this.state.redirectCount}
          {redirectCount === 1 ? ' second' : ' seconds'}. </p>
        {this.renderForm()}
      </div>
    );
  }
}
