import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';

export default class PendingOrganizerRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};

    this.nameInput = React.createRef();

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  handleDeleteClick() {
    this.props.discardListing(this.props.pendingOrganizer.id);
  }

  handleSaveClick() {
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveChanges(this.props.pendingOrganizer.id, newData);
    this.setState({editable: false});
  }

  render() {
    const pendingOrg = this.props.pendingOrganizer;
    const createdAt = Moment(pendingOrg.created_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={this.nameInput} defaultValue={pendingOrg.name} />
          </td>
          <td>{createdAt}</td>
        </tr>
      );
    }

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingOrganizers/${pendingOrg.id}`}>{pendingOrg.name}</Link></td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
