import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";

export default class EventRow extends ListingRow {
  constructor(props) {
    super(props);

    this.state = {is_published: false};

    this.startInput = React.createRef();
    this.endInput = React.createRef();
    this.venueList = React.createRef();
    this.orgList = React.createRef();
    this.liveToggle = React.createRef();
  }

  componentDidMount() {
    this.props.checkForLive(this.props.listing.id).then(results => {
      this.setState({is_published: results.total > 0});
    }, err => {
      console.log('error in checking for live', JSON.stringify(err));
    });
  }

  handleSaveClick() {
    const newData = {
      uuid: this.props.listing.uuid,
      name: this.nameInput.current.value.trim(),
      start_date: Moment(this.startInput.current.value).valueOf(),
      end_date: Moment(this.endInput.current.value).valueOf(),
      venue_uuid: this.venueList.current.value,
      org_uuid: this.orgList.current.value
    };

    // Save changes
    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.setState({editable: false});
    });

    // Publish/drop
    if (this.liveToggle.current.value) {
      this.props.registerEventLive(this.props.listing.id);
    } else {
      this.props.registerEventDropped(this.props.listing.id);
    }
  }

  handleDeleteClick() {
    // Delete
    this.props.deleteListing(this.props.listing.id);

    // Drop
    this.props.registerEventDropped(this.props.listing.id);
  }

  render() {
    const event = this.props.listing;
    const venues = this.props.venues;
    const orgs = this.props.orgs;
    const is_published = this.state.is_published;

    const startDate = Moment(event.start_date).format('MM/DD/YYYY');
    const startDateVal = Moment(event.start_date).format('YYYY-MM-DD');
    const endDate = Moment(event.end_date).format('MM/DD/YYYY');
    const endDateVal = Moment(event.end_date).format('YYYY-MM-DD');
    const updatedAt = Moment(event.updated_at).calendar();
    const defaultVenue = typeof(this.props.venue) !== 'undefined' ? this.props.venue.uuid : this.props.venues[0].uuid;
    const defaultOrg = typeof(this.props.org) !== 'undefined' ? this.props.org.uuid : this.props.orgs[0].uuid;

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={event.name} /></td>
          <td><input type={'date'} ref={this.startInput} defaultValue={startDateVal} /></td>
          <td><input type={'date'} ref={this.endInput} defaultValue={endDateVal} /></td>
          <td><select ref={this.venueList} defaultValue={defaultVenue}>{renderOptionList(venues)}</select></td>
          <td><select ref={this.orgList} defaultValue={defaultOrg}>{renderOptionList(orgs)}</select></td>
          <td>{updatedAt}</td>
          <td>
            <input id={'toggle-' + event.id} ref={this.liveToggle} className={'toggle'} type={'checkbox'}
                   defaultChecked={is_published} />
            <label className={'toggle-switch'} htmlFor={'toggle-' + event.id} />
          </td>
        </tr>
      );
    }

    const venueLink = this.props.venue ?
      <Link to={`/venues/${event.venue_id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.org ?
      <Link to={`/organizers/${event.org_id}`}>{this.props.org.name}</Link> : 'NO ORGANIZER';
    const eventStatus = is_published ? <span className="bolded">Published</span> :
      <span className="muted">Dropped</span>;

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
        <td>{updatedAt}</td>
        <td>{eventStatus}</td>
      </tr>
    );
  }
};
