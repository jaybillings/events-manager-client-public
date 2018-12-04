import React, {Component} from "react";
import Moment from "moment";
import {Link} from "react-router-dom";

import "../styles/schema-row.css";
import "../styles/toggle.css";

export default class ListingRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};

    this.nameInput = React.createRef();

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  handleSaveClick() {
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveChanges(this.props.listing.id, newData);
    this.setState({editable: false});
  }

  render() {
    const listing = this.props.listing;
    const schema = this.props.schema;
    const updatedAt = Moment(listing.updated_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={listing.name} /></td>
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
        <td><Link to={`/${schema}/${listing.uuid}`}>{listing.name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
