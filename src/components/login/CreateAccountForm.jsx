import React, {Component} from 'react';

export default class CreateAccountForm extends Component {
  constructor(props) {
    super(props);

    this.authManagementUrl = 'http://localhost:3030/authmanagement/';
    this.sendAddress = 'noreply@visitseattle.org';

    this.state = {newUser: null};

    this.handleResendEmailClick = this.handleResendEmailClick.bind(this);
    this.handleCreateAccountClick = this.handleCreateAccountClick.bind(this);
  }

  handleResendEmailClick() {
    const payload = {
      action: 'resendVerifySignup',
      value: {email: this.state.newUser.email}
    };

    fetch(this.authManagementUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    })
      .then(response => {
        return response.json(); // convert raw response body to JSON
      })
      .then(body => {
        if (body.code >= 400) {
          console.error(body.message);
          this.props.updateMessagePanel({status: 'error', details: body.message});
        } else {
          console.debug('success!');
          this.props.updateMessagePanel({
            status: 'success',
            details: `Email has been re-sent. If you still don't see it, make sure ${this.sendAddress} is in your spam whitelist.`
          })
        }
      });
  }

  handleCreateAccountClick(e) {
    e.preventDefault();
    this.props.createUser()
      .then(result => {
        this.props.updateMessagePanel({
          status: 'info',
          details: 'Account created. A verification email has been sent to your address.'
            + ' Follow the emailed instructions to finish account creation.'
        });
        console.debug('handlecreateaccount result', result);
        this.setState({newUser: result});
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: 'Error during user creation: ' + err.message});
        this.setState({newUser: {}});
        console.error(err);
      });
  }

  render() {
    const primaryButton = this.state.newUser ? <button type={'button'} onClick={this.handleResendEmailClick}>resend verification email</button>
      : <button type={'button'} onClick={this.handleCreateAccountClick} className={'button-primary'}>create
        account</button>;

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
          <button type={'button'} className={'fakeLink'} onClick={this.props.toggleLoginState}><span>log in to account</span></button>
          {primaryButton}
        </div>
      </form>
    );
  }
};
