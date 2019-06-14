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
    this.props.createUser()
      .then(result => {
        this.props.updateMessagePanel({
          status: 'info',
          details: 'Account created. A verification email has been sent to your address.'
            + ' Follow the emailed instructions to finish account creation.'
        });
        this.setState({newUser: result});
      })
      .catch(err => {
        this.setState({newUser: {}});
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
          <input id={'emailInput'} type={'text'} name={'email'} value={this.props.email}
                 onChange={this.props.handleInputChange} required />
          <label htmlFor={'passInput'}>Password</label>
          <input id={'passInput'} type={'password'} name={'password'} value={this.props.password}
                 onChange={this.props.handleInputChange} required />
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
