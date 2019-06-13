import React, {Component} from 'react';

/**
 * `UserRow` displays a single row from the user table.
 * @class
 */
export default class UserRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      permissions: this.props.user.permissions
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  /**
   * `handleInputChange` runs when input changes and saves the new value to the state.
   *
   * @param {Event} e
   */
  handleInputChange(e) {
    if (!e.target.name || !e.target.value) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  /**
   * `handleSaveClick` runs when the save button is clicked. Triggers saving of the row's data.
   */
  handleSaveClick() {
    const newData = {permissions: this.state.permissions};

    this.props.saveUser(this.props.user.id, newData);
  }

  /**
   * `handleDeleteClick` runs when the delete button is clicked. Triggers deletion of the user.
   */
  handleDeleteClick() {
    if (window.confirm(`Are you sure you want to delete ${this.props.user.email}? This action is PERMANENT.`)) {
      this.props.deleteUser(this.props.user.id);
    }
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    // TODO: Don't hardcode permissions.
    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save Changes</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete User</button>
        </td>
        <td>{this.props.user.email}</td>
        <td>{this.props.user.api_key}</td>
        <td>
          <select name={'permissions'} value={this.state.permissions || "user"} onChange={this.handleInputChange}>
            <option value={"user:*"}>User</option>
            <option value={"super_user:*"}>Super User</option>
            <option value={"admin:*"}>Admin</option>
            <option value={"api_only:*"}>API Only</option>
          </select>
        </td>
      </tr>
    );
  }
};
