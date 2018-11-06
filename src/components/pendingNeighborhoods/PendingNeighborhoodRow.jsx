import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderUpdateStatus} from "../../utilities";

export default class PendingNeighborhoodRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, is_new: true, is_dup: false};

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
    this.props.discardListing(this.props.pendingNeighborhood.id);
  }

  handleSaveClick() {
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveChanges(this.props.pendingNeighborhood.id, newData);
    this.setState({editable: false});
  }

  checkIfDup() {
    this.props.hoodIsDup(this.props.pendingNeighborhood).then(message => {
      this.setState({is_dup: message.total && message.total > 0});
    }, err => console.log('error in checkIfDup()', err));
  }

  checkIfNew() {
    this.setState({is_new: !this.props.pendingNeighborhood.target_id});
  }

  render() {
    const pendingHood = this.props.pendingNeighborhood;
    const createdAt = Moment(pendingHood.created_at).calendar();
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
            <input type={'text'} ref={this.nameInput} defaultValue={pendingHood.name} />
          </td>
          <td>{createdAt}</td>
          <td>{renderUpdateStatus(isDup, isNew, 'neighborhood')}</td>
        </tr>
      );
    }

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingNeighborhoods/${pendingHood.id}`}>{pendingHood.name}</Link></td>
        <td>{createdAt}</td>
        <td>{renderUpdateStatus(isDup, isNew, 'neighborhood')}</td>
      </tr>
    );
  }
};
