import React, {Component} from 'react';

import '../../styles/schema-record.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.renderOptionList = this.renderOptionList.bind(this);
  }

  renderOptionList(schema) {
    let optionsList = [];

    schema.forEach(record => {
      optionsList.push(<option key={record.id} value={record.id}>{record.name}</option>);
    });

    return optionsList;
  }

  render() {
    const event = this.props.event;
    const venues = this.props.venues;
    const organizers = this.props.organizers;
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };

    const updatedReadable = event.updated_at ? new Date(event.updated_at).toLocaleString('en-US', dateFormatOptions) : '';
    const createdReadable = event.created_at ? new Date(event.created_at).toLocaleString('en-US', dateFormatOptions) : '';

    return (
      <form id="event-listing-form" className={'schema-record'} onSubmit={this.props.handleSubmit}>
        <div>
          <button type="button" ref="deleteButton" onClick={this.props.deleteEvent}>Delete Event</button>
          <button type="submit" ref="submitButton" className="button-primary">Save Changes</button>
        </div>
        <label>
          ID
          <input type="text" defaultValue={event.id} disabled/>
        </label>
        <label>
          Created at
          <input type="text" defaultValue={createdReadable} disabled/>
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedReadable} disabled/>
        </label>
        <label>
          Name
          <input type="text" ref="nameInput" defaultValue={event.name}/>
        </label>
        <label>
          Start Date
          <input type="date" ref="startInput" defaultValue={event.start_date}/>
        </label>
        <label>
          End Date
          <input type="date" ref="endInput" defaultValue={event.end_date}/>
        </label>
        <label>
          Venue
          <select ref="venueList" defaultValue={event.venue_id || ''}>{this.renderOptionList(venues)}</select>
        </label>
        <label>
          Organizer
          <select ref="orgList" defaultValue={event.org_id || ''}>{this.renderOptionList(organizers)}</select>
        </label>
        <label>
          Description
          <textarea ref="descInput" defaultValue={event.description}/>
        </label>
      </form>
    );
  }
};
