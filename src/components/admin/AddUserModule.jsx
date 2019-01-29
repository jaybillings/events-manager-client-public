import React, {Component} from 'react';

import '../../styles/user-add-form.css';

export default class AddUserModule extends Component {
  constructor(props) {
    super(props);

    this.state = {email: '', permissions: 'user:*', password: ''};

    this.generatePassword = this.generatePassword.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.clearForm = this.clearForm.bind(this);
  }

  generatePassword() {
  }

  /**
   * Handles input changes by saving the data to the component's state.
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  handleSubmit(e) {
    e.preventDefault();

    this.props.createUser({
      email: this.state.email,
      permissions: this.state.permissions,
      password: this.state.password
    }).then(() => {
      this.clearForm();
    })
  }

  clearForm() {
    this.setState({email: '', permissions: 'user:*', password: ''});
  }

  render() {
    return (
      <form key={'user-add-form'} className={'user-add-form'} onSubmit={this.handleSubmit}>
        <label className={'emailInput'}>
          <span>Email Address</span>
          <input type={'email'} name={'email'} value={this.state.email} required maxLength={100}
                 onChange={this.handleInputChange} />
        </label>
        <label className={'permsInput'}>
          <span>Permissions</span>
          <select name={'permissions'} value={this.state.permissions} onChange={this.handleInputChange}>
            <option value={"user:*"}>User</option>
            <option value={"super_user:*"}>Super User</option>
            <option value={"admin:*"}>Admin</option>
            <option value={"api_only:*"}>API Only</option>
          </select>
        </label>
        <label className={'pwInput'}>
          <span>Password</span>

            <input type={'text'} name={'password'} value={this.state.password} required
                   onChange={this.handleInputChange} />
            <button type={'button'} onClick={this.generatePassword}>Generate</button>

        </label>
        <div className={'buttons'}>
          <button type={'button'} onClick={this.clearForm}>Reset</button>
          <button type={'submit'} className={'button-primary'}>Add User</button>
        </div>
      </form>
    );
  }
};
