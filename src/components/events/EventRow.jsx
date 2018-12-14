import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";

export default class EventRow extends ListingRow {
  constructor(props) {
    super(props);

    const event = this.props.listing;
    const venueUUID = typeof this.props.venue === 'undefined' ? '' : this.props.venue.uuid;
    const orgUUID = typeof this.props.org === 'undefined' ? '' : this.props.org.uuid;
    this.state = {
      eventName: event.name, eventStart: event.start_date, eventEnd: event.end_date,
      eventVenue: venueUUID, eventOrg: orgUUID, is_published: false, editable: false
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  componentDidMount() {
    this.props.checkForLive(this.props.listing.id).then(results => {
      this.setState({is_published: results.total > 0});
    }, err => {
      console.log('error in checking for live', JSON.stringify(err));
    });
  }

  handleInputChange(e) {
    const newState = {};

    if (e.target.name === 'is_published') {
      this.setState(prevState => ({is_published: !prevState.is_published}));
    } else {
      newState[e.target.name] = e.target.value.trim();
      this.setState(newState);
    }
  }

  handleSaveClick() {
    const id = this.props.listing.id;
    const newData = {
      uuid: this.props.listing.uuid,
      name: this.state.eventName,
      start_date: Moment(this.state.eventStart).valueOf(),
      end_date: Moment(this.state.eventStart).valueOf(),
      venue_uuid: this.state.eventVenue,
      org_uuid: this.state.eventOrg
    };

    // Save changes
    this.props.updateListing(id, newData).then(() => {
      this.setState({editable: false});
    });

    // Publish/drop
    if (this.state.is_published) {
      this.props.registerEventLive(id);
    } else {
      this.props.registerEventDropped(id);
    }
  }

  handleDeleteClick() {
    const id = this.props.listing.id;

    this.props.deleteListing(id);
    this.props.registerEventDropped(id);
  }

  render() {
    const startDate = Moment(this.state.eventStart).format('MM/DD/YYYY');
    const startDateVal = Moment(this.state.eventStart).format('YYYY-MM-DD');
    const endDate = Moment(this.state.eventEnd).format('MM/DD/YYYY');
    const endDateVal = Moment(this.state.eventEnd).format('YYYY-MM-DD');
    const updatedAt = Moment(this.props.listing.updated_at).calendar();
    const defaultVenue = this.state.eventVenue || this.props.venues[0].uuid;
    const defaultOrg = this.state.eventOrg || this.props.orgs[0].uuid;

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'submit'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'eventName'} value={this.state.eventName} onChange={this.handleInputChange}/></td>
          <td><input type={'date'} name={'eventStart'} value={startDateVal} onChange={this.handleInputChange}/></td>
          <td><input type={'date'} name={'eventEnd'} value={endDateVal} onChange={this.handleInputChange}/></td>
          <td><select value={defaultVenue} name={'eventVenue'} onChange={this.handleInputChange}>{renderOptionList(this.props.venues)}</select></td>
          <td><select value={defaultOrg} name={'eventOrg'} onChange={this.handleInputChange}>{renderOptionList(this.props.orgs)}</select></td>
          <td>{updatedAt}</td>
          <td>
            <input id={'toggle-' + this.props.listing.id} name={'is_published'} type={'checkbox'} className={'toggle'}
                   checked={this.state.is_published} onChange={this.handleInputChange}/>
            <label className={'toggle-switch'} htmlFor={'toggle-' + this.props.listing.id} />
          </td>
        </tr>
      );
    }

    const venueLink = this.props.venue ?
      <Link to={`/venues/${this.props.venue.id}`}>{this.props.venue.name}</Link> : 'NO VENUE';
    const orgLink = this.props.org ?
      <Link to={`/organizers/${this.props.org.id}`}>{this.props.org.name}</Link> : 'NO ORGANIZER';
    const eventStatus = this.state.is_published ? <span className="bolded">Published</span> :
      <span className="muted">Dropped</span>;

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Delete</button>
        </td>
        <td><Link to={`/events/${this.props.listing.id}`}>{this.props.listing.name}</Link></td>
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
