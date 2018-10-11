import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingVenueRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const id = this.props.pendingVenue.id;
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveVenue(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingVenue.id;
    this.props.deleteVenue(id);
  }

  render() {
    const pendingVenue = this.props.pendingVenue;
    const venueId = pendingVenue.target_id || 'N/A';
    const createdAt = Moment(pendingVenue.created_at).calendar();
    const updatedAt = Moment(pendingVenue.updated_at).calendar();

    return (
      <form id={'pending-venue-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Venue ID
          <input type={'text'} defaultValue={venueId} disabled />
        </label>
        <label>
          Created
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} defaultValue={updatedAt} disabled />
        </label>
        <label className={'required'}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={pendingVenue.name} required maxLength={100} />
        </label>
        <div className={'block-warning'} title={'Caution: This venue is pending. It must be pushed live before it is visible on the site.'}>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
          <button type={'button'} onClick={this.handleClickDelete}>Discard Venue</button>
        </div>
      </form>
    );
  }
};
