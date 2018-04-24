import React, {Component} from 'react';

import '../../styles/listing-forms.css';

export default class EventRecord extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    this.refs.submitButton.disabled = false;
  }

  render() {
    const listing = this.props.event;
    const dateFormatOptions = {
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    };

    const updatedReadable = listing.updated_at ? new Date(listing.updated_at).toLocaleString('en-US', dateFormatOptions) : '';
    const createdReadable = listing.created_at ? new Date(listing.created_at).toLocaleString('en-US', dateFormatOptions) : '';

    return (
      <form id="event-listing-form" onSubmit={this.props.handleSubmit} onChange={this.handleChange}>
        <div>
          <button type="submit" ref="submitButton" disabled>Save Changes</button>
          <button type="button" ref="deleteButton" onClick={this.props.deleteEvent}>Delete Event</button>
        </div>
        <label>
          ID
          <input type="text" defaultValue={listing.id} disabled/>
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
          <input type="text" ref="nameInput" defaultValue={listing.name}/>
        </label>
        <label>
          Start Date
          <input type="date" ref="startInput" defaultValue={listing.start_date}/>
        </label>
        <label>
          End Date
          <input type="date" ref="endInput" defaultValue={listing.end_date}/>
        </label>
        <label>
          Description
          <textarea ref="descInput" defaultValue={listing.description}/>
        </label>
      </form>
    );
  }
};
