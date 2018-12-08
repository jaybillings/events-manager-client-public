import React, {Component} from 'react';
import Moment from 'moment';
import {makeTitleCase} from "../utilities";
import {Link} from "react-router-dom";

import StatusLabel from "./common/StatusLabel";

import "../styles/schema-row.css";

export default class PendingListingRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, write_status: ''};
    this.nameInput = React.createRef();

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.checkWriteStatus = this.checkWriteStatus.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  componentDidMount() {
    this.checkWriteStatus(this.props.pendingListing);
  }

  startEdit(e) {
    e.stopPropagation();
    this.setState({editable: true});
  }

  cancelEdit(e) {
    e.stopPropagation();
    this.setState({editable: false});
  }

  handleDeleteClick(e) {
    e.stopPropagation();
    this.props.removeListing(this.props.pendingListing.id);
  }

  handleSaveClick(e) {
    e.stopPropagation();

    const id = this.props.pendingListing.id;
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveChanges(id, newData).then(result => {
      this.checkWriteStatus(result);
      this.setState({editable: false});
    });
  }

  handleRowClick() {
    const selected = !this.props.selected;
    this.props.selectListing(this.props.pendingListing.id, selected);
  }

  checkWriteStatus(listing) {
    this.props.queryForExisting(listing).then(result => {
      let writeStatus;

      if (!result.total) {
        writeStatus = 'new';
      } else {
        const uuids = result.data.map(row => row.uuid);
        if (uuids.includes(this.props.pendingListing.uuid)) {
          writeStatus = 'update';
        } else {
          writeStatus = 'duplicate';
        }
      }

      this.setState({write_status: writeStatus});
    });
  }

  render() {
    const pendingListing = this.props.pendingListing;
    const createdAt = Moment(pendingListing.created_at).calendar();
    const selected = this.props.selected;
    const writeStatus = this.state.write_status;
    const selectClass = selected ? ' is-selected' : '';
    const schema = this.props.schema;
    const titleCaseSchema = makeTitleCase(this.props.schema);

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input type={'text'} ref={this.nameInput} defaultValue={pendingListing.name} /></td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
        </tr>
      );
    }

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'delete'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td><Link to={`/pending${titleCaseSchema}/${pendingListing.uuid}`}>{pendingListing.name}</Link></td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
      </tr>
    );
  }
};
