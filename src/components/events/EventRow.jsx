import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {renderOptionList} from '../../utilities';
import app from '../../services/socketio';

import '../../styles/schema-row.css';
import '../../styles/toggle.css';

export default class EventRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.eventsService = app.service('events');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteEvent() {
    // TODO: Only admins should be able to do this
    this.eventsService.remove(this.props.event.id).then(message => console.log('remove', message));
  }

  saveEvent() {
    const newData = {
      name: this.refs['nameInput'].value.trim(),
      start_date: Moment(this.refs['startInput'].value).valueOf(),
      end_date: Moment(this.refs['endInput'].value).valueOf(),
      venue_id: this.refs['venueList'].value,
      org_id: this.refs['orgList'].value,
      is_published: this.refs['statusInput'].checked
    };

    this.eventsService.patch(this.props.event.id, newData).then((message) => console.log('patch', message));
    this.setState({editable: false});
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const venueLink = this.props.venue ?
      <Link to={`/venues/${event.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.organizer ?
      <Link to={`/organizers/${event.org_id}`}>{this.props.organizer.name}</Link> : 'NO ORGANIZER';
    const eventStatus = this.props.event['is_published'] ? <span className="bolded">Published</span> :
      <span className="muted">Dropped</span>;
    const updatedAt = Moment(event.updated_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.saveEvent}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={event.name} />
          </td>
          <td>
            <input type={'date'} ref={'startInput'} defaultValue={Moment(event.start_date).format('YYYY-MM-DD')} />
          </td>
          <td>
            <input type={'date'} ref={'endInput'} defaultValue={Moment(event.end_date).format('YYYY-MM-DD')} />
          </td>
          <td>
            <select ref={'venueList'} defaultValue={event.venue_id || ''}>{renderOptionList(venues)}</select>
          </td>
          <td>
            <select ref={'orgList'} defaultValue={event.org_id || ''}>{renderOptionList(organizers)}</select>
          </td>
          <td>
            <input id={'toggle-' + event.id} ref={'statusInput'} className={'toggle'} type={'checkbox'}
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
          <button type={'button'} onClick={this.deleteEvent}>Delete</button>
        </td>
        <td><Link to={`/events/${event.id}`}>{event.name}</Link></td>
        <td>{Moment(event.start_date).format('MM/DD/YYYY')}</td>
        <td>{Moment(event.end_date).format('MM/DD/YYYY')}</td>
        <td>{venueLink}</td>
        <td>{orgLink}</td>
        <td>{eventStatus}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
