import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList} from '../../utilities';

import '../../styles/schema-row.css';
import '../../styles/toggle.css';

export default class EventRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};

    this.nameInput = React.createRef();
    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.venueList = React.createRef();
    this.orgList = React.createRef();
    this.liveToggle = React.createRef();

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
    this.props.deleteListing(this.props.event.id);
  }

  handleSaveClick() {
    const newData = {
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_id: this.venueList.current.value,
      org_id: this.orgList.current.value,
      is_published: this.liveToggle.current.checked
    };

    this.props.saveChanges(this.props.event.id, newData);
    this.setState({editable: false});
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const venueLink = this.props.venue ?
      <Link to={`/venues/${event.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const organizers = this.props.organizers;
    const orgLink = this.props.organizer ?
      <Link to={`/organizers/${event.org_id}`}>{this.props.organizer.name}</Link> : 'NO ORGANIZER';
    const startDate = Moment(event.start_date).format('MM/DD/YYYY');
    const startDateVal = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('MM/DD/YYYY');
    const endDateVal = Moment(event.end_date).format('YYYY-MM-DD');
    const updatedAt = Moment(event.updated_at).calendar();
    const eventStatus = this.props.event['is_published'] ? <span className="bolded">Published</span> :
      <span className="muted">Dropped</span>;

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={this.nameInput} defaultValue={event.name} />
          </td>
          <td>
            <input type={'date'} ref={this.startInput} defaultValue={startDateVal} />
          </td>
          <td>
            <input type={'date'} ref={this.endInput} defaultValue={endDateVal} />
          </td>
          <td>
            <select ref={this.venueList} defaultValue={event.venue_id || ''}>{renderOptionList(venues)}</select>
          </td>
          <td>
            <select ref={this.orgList} defaultValue={event.org_id || ''}>{renderOptionList(organizers)}</select>
          </td>
          <td>
            <input id={'toggle-' + event.id} ref={this.liveToggle} className={'toggle'} type={'checkbox'}
                   defaultChecked={event.is_published} />
            <label className={'toggle-switch'} htmlFor={'toggle-' + event.id} />
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button>
        </td>
        <td><Link to={`/events/${event.id}`}>{event.name}</Link></td>
        <td>{startDate}</td>
        <td>{endDate}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{eventStatus}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
