import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import Moment from 'moment';
import {renderOptionList} from "../../utilities";

export default class PendingEventRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};

    this.nameInput = React.createRef();
    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.venueList = React.createRef();
    this.orgList = React.createRef();

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
    this.props.discardListing(this.props.pendingEvent.id);
  }

  handleSaveClick() {
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueList.current.value,
      org_id: this.orgList.current.value
    };

    console.log('newData', newData);

    this.props.saveChanges(this.props.pendingEvent.id, newData);
    this.setState({editable: false});
  }

  render() {
    const pendingEvent = this.props.pendingEvent;
    const venues = this.props.venues;
    const venueLink = this.props.venue ?
      <Link to={`/venues/${pendingEvent.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const organizers = this.props.organizers;
    const orgLink = this.props.organizer ?
      <Link to={`/organizers/${pendingEvent.org_id}`}>{this.props.organizer.name}</Link> : 'NO ORGANIZER';
    const createdAt = Moment(pendingEvent.created_at).calendar();
    const startDate = Moment(pendingEvent.start_date).format('MM/DD/YYYY');
    const startDateVal = Moment(pendingEvent.start_date).format('YYYY-MM-DD');
    const endDate = Moment(pendingEvent.end_date).format('MM/DD/YYYY');
    const endDateVal = Moment(pendingEvent.end_date).format('YYYY-MM-DD');

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={this.nameInput} defaultValue={pendingEvent.name} />
          </td>
          <td>
            <input type={'date'} ref={this.startInput} defaultValue={startDateVal} />
          </td>
          <td>
            <input type={'date'} ref={this.endInput} defaultValue={endDateVal} />
          </td>
          <td>
            <select ref={this.venueList} defaultValue={pendingEvent.venue_id || ''}>{renderOptionList(venues)}</select>
          </td>
          <td>
            <select ref={this.orgList} defaultValue={pendingEvent.org_id || ''}>{renderOptionList(organizers)}</select>
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
        <td><Link to={`/pendingEvents/${pendingEvent.id}`}>{pendingEvent.name}</Link></td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
