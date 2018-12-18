import React, {Component} from "react";
import Moment from "moment";
import {Link} from "react-router-dom";

import "../styles/schema-row.css";

export default class ListingRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, listingName: this.props.listing.name};

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  handleInputChange(e) {
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  handleSaveClick() {
    const newData = {uuid: this.props.listing.uuid, name: this.state.listingName};

    this.props.updateListing(this.props.listing.id, newData).then(() => {
      this.setState({editable: false});
    });
  }

  handleDeleteClick() {
    this.props.deleteListing(this.props.listing.id);
  }

  render() {
    const schema = this.props.schema;
    const id = this.props.listing.id;
    const name = this.state.listingName;
    const updatedAt = Moment(this.props.listing.updated_at).calendar();

    if (this.state.editable) {
      return (
        <tr className={'schema-row'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} name={'listingName'} value={name} onChange={this.handleInputChange}/></td>
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
        <td><Link to={`/${schema}/${id}`}>{name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
