import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList, renderUpdateStatus} from "../../utilities";

export default class PendingVenueRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, is_new: true, is_dup: false};

    this.nameInput = React.createRef();
    this.hoodList = React.createRef();

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
    this.props.discardListing(this.props.pendingVenue.id);
  }

  handleSaveClick() {
    const newData = {
      name: this.nameInput.current.value.trim(),
      hood_id: this.hoodList.current.value
    };

    this.props.saveChanges(this.props.pendingVenue.id, newData);
    this.setState({editable: false});
  }

  checkIfDup() {
    this.props.venueIsDup(this.props.pendingVenue).then(message => {
      this.setState({is_dup: message.total && message.total > 0});
    }, err => console.log('error in checkIfDup()', err));
  }

  checkIfNew() {
    const targetID = this.props.pendingVenue.target_id;
    if (targetID) {
      this.props.venueIsNew(targetID).then(() => {
        this.setState({is_new: false});
      });
    }
  }

  render() {
    const pendingVenue = this.props.pendingVenue;
    const neighborhoods = this.props.neighborhoods;
    const hoodLink = this.props.neighborhood
      ? <Link to={`/pendingNeighborhoods/${this.props.neighborhood.id}`}>{this.props.neighborhood.name}</Link>
      : 'NO NEIGHBORHOOD';
    const createdAt = Moment(pendingVenue.created_at).calendar();
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
            <input type={'text'} ref={this.nameInput} defaultValue={pendingVenue.name} />
          </td>
          <td>
            <select ref={this.hoodList} defaultValue={pendingVenue.hood_id || ''} required>
              {renderOptionList(neighborhoods)}
            </select>
          </td>
          <td>{createdAt}</td>
          <td>{renderUpdateStatus(isDup, isNew, 'venue')}</td>
        </tr>
      );
    }

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pendingVenues/${pendingVenue.id}`}>{pendingVenue.name}</Link></td>
        <td>{hoodLink}</td>
        <td>{createdAt}</td>
        <td>{renderUpdateStatus(isDup, isNew, 'venue')}</td>
      </tr>
    );
  }
};
