import React, {Component} from 'react';

/**
 * LoginForm handles the form responsible for user account login.
 */
export default class LoginForm extends Component {
  constructor(props) {
    super(props);

    this.emailRef = React.createRef();
    this.passwordRef = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Runs when the form submits.
   * @param {Event} e
   */
  handleSubmit(e) {
    e.preventDefault();

    const email = this.emailRef.current.value;
    const password = this.passwordRef.current.value;

    this.props.logInUser(email, password);
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className={'input-container'}>
          <label htmlFor={'emailInput'}>Email Address</label>
          <input ref={this.emailRef} id={'emailInput'} type={'text'} required />
          <label htmlFor={'passInput'}>Password</label>
          <input ref={this.passwordRef} id={'passInput'} type={'password'} required />
        </div>
        <div className={'button-container'}>
          <button type={'button'} className={'fakeLink'} onClick={this.props.toggleLoginState}><span>create new account</span></button>
          <button type={'submit'} className={'button-primary'}>log in</button>
        </div>
      </form>
    );
  }
};
