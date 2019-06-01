import React from 'react';
import Moment from 'moment';
import {Link} from 'react-router-dom';
import {diffListings, renderOptionList, renderSchemaLink} from "../../utilities";

import PendingListingRow from "../PendingListingRow";
import StatusLabel from "../common/StatusLabel";

/**
 * PendingVenueRow displays a single row in a pending venues table.
 *
 * @class
 * @child
 */
export default class PendingVenueRow extends PendingListingRow {
  constructor(props) {
    super(props);

    this.hoodRef = React.createRef();
  }

  /**
   * `handleSaveClick` handles the save button click by parsing the new data
   * and triggering the update function.
   *
   * @override
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {
      name: this.nameRef.current.value,
      hood_uuid: this.hoodRef.current.value
    };

    this.props.updateListing(this.props.listing, newData)
      .then(() => this.setState({editable: false}));
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const listingID = this.props.listing.id;
    const listingName = this.props.listing.name;
    const hoods = this.props.hoods;
    const writeStatus = this.state.writeStatus;

    const hoodUUID = this.props.listing.hood_uuid || '';
    const createdAt = Moment(this.props.listing.created_at).calendar();
    const selectClass = this.props.selected ? ' is-selected' : '';

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input ref={this.nameRef} type={'text'} name={'listingName'} defaultValue={listingName}
                     onClick={e => e.stopPropagation()} /></td>
          <td>
            <select ref={this.hoodRef} name={'linkedHoodUUID'} defaultValue={hoodUUID}
                    onClick={e => e.stopPropagation()} required>
              {renderOptionList(hoods, 'neighborhoods', 'uuid')}
            </select>
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
        </tr>
      );
    }

    const classNameMap = this.state.matchingLiveListing ? diffListings(this.state.matchingLiveListing, this.props.listing, ['name', 'hood_uuid']) : {};
    const hoodLink = this.props.hood ? renderSchemaLink(this.props.hood, 'neighborhoods') : 'NO NEIGHBORHOOD';

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td className={classNameMap['name']}><Link to={`/pendingVenues/${listingID}`}>{listingName}</Link></td>
        <td className={classNameMap['hood_uuid']}>{hoodLink}</td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={'venues'} /></td>
      </tr>
    );
  }
};
