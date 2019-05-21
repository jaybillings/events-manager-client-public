import React, {Component} from 'react';

export default class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.logInUser();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className={'input-container'}>
          <label htmlFor={'emailInput'}>Email Address</label>
          <input id={'emailInput'} type={'text'} name={'email'} value={this.props.email}
                 onChange={this.props.handleInputChange} required />
          <label htmlFor={'passInput'}>Password</label>
          <input id={'passInput'} type={'password'} name={'password'} value={this.props.password}
                 onChange={this.props.handleInputChange} required />
        </div>
        <div className={'button-container'}>
          <button type={'button'} onClick={this.props.toggleLoginState}><span>create new account</span></button>
          <button type={'submit'} className={'button-primary'}>log in</button>
        </div>
      </form>
    );
  }
};
