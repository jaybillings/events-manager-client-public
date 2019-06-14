import React, {Component} from 'react';
import {displayErrorMessages, printToConsole} from "../../utilities";

/**
 * CreateAccountForm handles the form responsible for user account creation.
 *
 * @class
 */
export default class CreateAccountForm extends Component {
  constructor(props) {
    super(props);

    this.state = {newUser: null};

    this.emailRef = React.createRef();
    this.passwordRef = React.createRef();

    this.handleResendEmailClick = this.handleResendEmailClick.bind(this);
    this.handleCreateAccountClick = this.handleCreateAccountClick.bind(this);
  }

  /**
   * Runs on 'resend verification email' click.
   */
  handleResendEmailClick() {
    this.props.resendVerifyEmail(this.state.newUser);
  }

  /**
   * Runs on 'create account' button click.
   *
   * @param {Event} e
   */
  handleCreateAccountClick(e) {
    e.preventDefault();

    const email = this.emailRef.current.value;
    const password = this.passwordRef.current.value;

    this.props.createUser(email, password)
      .then(result => {
        this.props.updateMessagePanel({
          status: 'info',
          details: 'Account created. A verification email has been sent to your address.'
            + ' Follow the emailed instructions to finish account creation.'
        });
        console.debug(result);
        this.setState({newUser: result});
      })
      .catch(err => {
        this.setState({newUser: null});
        displayErrorMessages('create', 'new user', err, this.props.updateMessagePanel);
        printToConsole(err, 'error');
      });
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const primaryButton = this.state.newUser ?
      <button type={'button'} onClick={this.handleResendEmailClick}>resend verification email</button>
      : <button type={'button'} onClick={this.handleCreateAccountClick} className={'button-primary'}>create account</button>;

    return (
      <form>
        <div className={'input-container'}>
          <label htmlFor={'emailInput'}>Email Address</label>
          <input ref={this.emailRef} id={'emailInput'} type={'text'} required />
          <label htmlFor={'passInput'}>Password</label>
          <input ref={this.passwordRef} id={'passInput'} type={'password'} required />
        </div>
        <div className={'button-container'}>
          <button type={'button'} className={'fakeLink'} onClick={this.props.toggleLoginState}>
            <span>log in to account</span></button>
          {primaryButton}
        </div>
      </form>
    );
  }
};
