import React from "react";
import Moment from "moment";
import {diffListings, renderOptionList} from "../../utilities";

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingVenueRecord is a component which displays a single pending venue's record.
 *
 * @class
 * @child
 * @param {{schema: String, listing: Object, matchingLiveListing: Object, hoods: Array,
 * updateListing: Function, deleteListing: Function, queryForDuplicate: Function}} props
 */
export default class PendingVenueRecord extends ListingRecordUniversal {
  constructor(props) {
    super(props);

    this.hoodInput = React.createRef();
    this.descInput = React.createRef();
    this.emailInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
    this.streetInput = React.createRef();
    this.cityInput = React.createRef();
    this.stateInput = React.createRef();
    this.zipInput = React.createRef();
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentDidMount`, the component fetches the listing's write status.
   *
   * @override
   */
  componentDidMount() {
    this.getWriteStatus()
      .then(writeStatus => {
        this.setState({writeStatus});
      });
  }

  /**
   * `handleSaveClick` handles the save action by parsing the new data and calling
   * an update handler.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.preventDefault();

    const newData = {
      name: this.nameInput.current.value,
      hood_uuid: this.hoodInput.current.value,
      description: this.descInput.current.value
    };

    // Only add non-required if they have value
    this.emailInput.current.value !== '' && (newData.email = this.emailInput.current.value);
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value);
    this.streetInput.current.value !== '' && (newData.address_street = this.streetInput.current.value);
    this.cityInput.current.value !== '' && (newData.address_city = this.cityInput.current.value);
    this.stateInput.current.value !== '' && (newData.address_state = this.stateInput.current.value);
    this.zipInput.current.value !== '' && (newData.address_zip = this.zipInput.current.value);

    this.props.updateListing(newData)
      .then(() => {
        return this.getWriteStatus()
      })
      .then(writeStatus => {
        this.setState({writeStatus})
      });
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const liveVenue = this.props.matchingLiveListing;
    const venue = this.props.listing;
    const hoods = this.props.hoods;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(venue.created_at).calendar();
    const updatedAt = Moment(venue.updated_at).calendar();

    const venueParams = ['name', 'hood_uuid', 'description', 'address_street',
      'address_city', 'address_state', 'address_zip', 'email', 'url', 'phone'];
    const classNameMap = diffListings(liveVenue, venue, venueParams);

    return (
      <form id={'pending-venue-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <div>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard Venue</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-events'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={venue.uuid} readOnly />
        </label>
        <label>
          Created
          <input type={'text'} value={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} value={updatedAt} disabled />
        </label>
        <label className={'required' + classNameMap['name']}>
          Name
          <input type={'text'} ref={this.nameInput} defaultValue={venue.name} required maxLength={100} />
        </label>
        <label className={'required-ish' + classNameMap['hood_uuid']}>
          Neighborhood
          <select ref={this.hoodInput} defaultValue={venue.hood_uuid || ''} required>
            {renderOptionList(hoods, 'neighborhoods', 'uuid')}
          </select>
        </label>
        <label className={'required-ish' + classNameMap['description']}>
          Description
          <textarea ref={this.descInput} defaultValue={venue.description} required maxLength={500} />
        </label>
        <label className={classNameMap['email']}>
          Email
          <input type={'email'} ref={this.emailInput} defaultValue={venue.email} />
        </label>
        <label className={classNameMap['url']}>
          Url
          <input type={'text'} ref={this.urlInput} defaultValue={venue.url} />
        </label>
        <label className={classNameMap['phone']}>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={venue.phone} />
        </label>
        <label className={classNameMap['address_street']}>
          Street Address
          <input type={'text'} ref={this.streetInput} defaultValue={venue.address_street} />
        </label>
        <label className={classNameMap['address_city']}>
          City
          <input type={'text'} ref={this.cityInput} defaultValue={venue.address_city} />
        </label>
        <label className={classNameMap['address_state']}>
          State
          <input type={'text'} ref={this.stateInput} defaultValue={venue.address_state} />
        </label>
        <label className={classNameMap['address_zip']}>
          Zip Code
          <input type={'text'} ref={this.zipInput} defaultValue={venue.address_zip} />
        </label>
        <div>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard Venue</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    );
  }
};
