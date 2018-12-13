import React from "react";
import Moment from "moment";
import {Link} from "react-router-dom";
import {renderOptionList} from "../../utilities";

import ListingRow from "../ListingRow";

export default class VenueRow extends ListingRow {
  constructor(props) {
    super(props);

    this.hoodList = React.createRef();
  }

  handleSaveClick() {
    const newData = {
      uuid: this.props.listing.uuid,
      name: this.nameInput.current.value.trim(),
      hood_uuid: this.hoodList.current.value
    };

    this.props.saveChanges(this.props.listing.id, newData);
    this.setState({editable: false});
  }

  render() {
    const venue = this.props.listing;
    const hoods = this.props.hoods;
    const updatedAt = Moment(venue['updated_at']).calendar();

    const defaultHood = typeof(this.props.hood) !== 'undefined' ? this.props.hood.uuid : this.props.hoods[0].uuid;
    const hoodNameLink = this.props.hood ? <Link to={`/neighborhoods/${venue.hood_id}`}>{ this.props.hood.name }</Link> : 'NO NEIGHBORHOOD';

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={venue.name} /></td>
          <td><select ref={this.hoodList} defaultValue={defaultHood}>{renderOptionList(hoods)}</select></td>
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
        <td><Link to={`/venues/${venue.uuid}`}>{venue.name}</Link></td>
        <td>{hoodNameLink}</td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
