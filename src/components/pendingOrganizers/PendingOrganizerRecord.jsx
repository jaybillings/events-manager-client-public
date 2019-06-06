import React from 'react';
import Moment from 'moment';

import ListingRecordUniversal from "../ListingRecordUniversal";
import StatusLabel from "../common/StatusLabel";
import {diffListings} from "../../utilities";

/**
 * `PendingOrganizerRecord` which displays a single pending organizer's record.
 *
 * @class
 * @child
 * @param {{schema: String, listing: Object, matchingLiveListing: Object,
 * updateListing: Function, removeListing: Function, queryForDuplicate: Function}} props
 */
export default class PendingOrganizerRecord extends ListingRecordUniversal {
  constructor(props) {
    super(props);

    this.descInput = React.createRef();
    this.urlInput = React.createRef();
    this.phoneInput = React.createRef();
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
        console.debug('writeStatus', writeStatus);
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
      description: this.descInput.current.value
    };

    // Only add non-required if they have a value
    this.urlInput.current.value !== '' && (newData.url = this.urlInput.current.value);
    this.phoneInput.current.value !== '' && (newData.phone = this.phoneInput.current.value);

    this.props.updateListing(newData);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const org = this.props.listing;
    const liveOrg = this.props.matchingLiveListing;
    const writeStatus = this.state.writeStatus;
    const createdAt = Moment(org.created_at).calendar();
    const updatedAt = Moment(org.updated_at).calendar();

    const orgParams = ['name', 'description', 'url', 'phone'];
    const classNameMap = diffListings(liveOrg, org, orgParams);

    return (
      <form id={'pending-org-listing-form'} className={'schema-record'} onSubmit={this.handleSaveClick}>
        <div>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard Organizer</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          Status
          <div>
            <StatusLabel writeStatus={writeStatus} schema={'pending-organizers'} />
          </div>
        </label>
        <label>
          UUID
          <input type={'text'} value={org.uuid} readOnly />
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
          <input type={'text'} ref={this.nameInput} defaultValue={org.name} required maxLength={100} />
        </label>
        <label className={'required-ish' + classNameMap['description']}>
          Description
          <textarea ref={this.descInput} defaultValue={org.description} required maxLength={500} />
        </label>
        <label className={classNameMap['url']}>
          Url
          <input type={'url'} ref={this.urlInput} defaultValue={org.url} maxLength={100} />
        </label>
        <label className={classNameMap['phone']}>
          Phone #
          <input type={'tel'} ref={this.phoneInput} defaultValue={org.phone} maxLength={20} />
        </label>
        <div>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard Organizer</button>
          <button type={'submit'} className={'button-primary'}>Save Changes</button>
        </div>
      </form>
    )
  }
}
