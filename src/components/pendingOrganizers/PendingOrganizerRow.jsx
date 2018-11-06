import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderUpdateStatus} from "../../utilities";

export default class PendingOrganizerRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};

    this.nameInput = React.createRef();

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.checkIfDup = this.checkIfDup.bind(this);
    this.checkIfNew = this.checkIfNew.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  componentDidMount() {
    this.checkIfDup();
    this.checkIfNew();
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

  checkIfDup() {
    this.props.orgIsDup(this.props.pendingOrganizer).then(message => {
      this.setState({is_dup: message.total && message.total > 0});
    }, err => console.log('error in checkIfDup()', err));
  }

  checkIfNew() {
    this.setState({is_new: !this.props.pendingOrganizer.target_id});
  }

  render() {
    const pendingOrg= this.props.pendingOrganizer;
    const createdAt = Moment(pendingOrg.created_at).calendar();
    const isDup = this.state.is_dup;
    const isNew = this.state.is_new;

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
          <td>{renderUpdateStatus(isDup, isNew, 'org')}</td>
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
        <td>{renderUpdateStatus(isDup, isNew, 'org')}</td>
      </tr>
    );
  }
};
