import React, {Component} from 'react';
import Moment from 'moment';
import {Link} from "react-router-dom";
import {diffListings} from "../utilities";

import StatusLabel from "./common/StatusLabel";

import "../styles/schema-row.css";

/**
 * PendingListingRow is a parent component that displays a single row in a
 * pending listing table.
 *
 * @class
 * @parent
 */
export default class PendingListingRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, writeStatus: '', matchingLiveListing: null};

    this.nameRef = React.createRef();

    this.getWriteStatus = this.getWriteStatus.bind(this);
    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleRowClick = this.handleRowClick.bind(this);
  }

  /**
   * Runs once the component mounts.
   *
   * During `componentDidMount`, the component checks the publish/write status
   * of the listing and queries for a matching live listing.
   * @override
   */
  componentDidMount() {
    this.props.queryForMatching(this.props.listing)
      .then(result => {
        this.setState({matchingLiveListing: result.data[0], editable: false}, () => {
          this.getWriteStatus().then(writeStatus => {
            this.setState({writeStatus});
          });
        });
      });
  }

  /**
   * `checkWriteStatus` determines how a pending listing relates to the published data.
   *
   *  `checkWriteStatus` returns a label indicating what will happen to a given listing
   *  when published. Possible results are:
   *   - "new": will make a new listing
   *   - "update:" will update a preexisting listing
   *   - "duplicate": will make a new listing that may duplicate an existing listing
   */
  async getWriteStatus() {
    const listing = this.props.listing;

    if (this.state.matchingLiveListing) return 'update';

    const similarListings = await this.props.queryForDuplicate(listing);

    if (similarListings.total) return 'duplicate';

    return 'new';
  }

  /**
   * `startEdit` marks a row as editable.
   *
   * @param {Event} e
   */
  startEdit(e) {
    e.stopPropagation();
    this.setState({editable: true});
  }

  /**
   * `endEdit` marks a row as not editable.
   * @param {Event} e
   */
  cancelEdit(e) {
    e.stopPropagation();
    this.setState({editable: false});
  }

  /**
   * `handleSaveClick` handles the save button click by parsing the new data
   * and triggering the update function.
   *
   * @param {Event} e
   */
  handleSaveClick(e) {
    e.stopPropagation();

    const newData = {name: this.nameRef.current.value};

    this.props.updateListing(this.props.listing, newData)
      .then(() => this.setState({editable: false}));
  }

  /**
   * `handleDeleteClick` handles the delete button click by triggering the delete
   * function.
   */
  handleDeleteClick(e) {
    e.stopPropagation();

    this.props.removeListing(this.props.listing);
  }

  /**
   * `handleRowClick` handles the row click by marking the listing as selected
   * and triggering the selection handler function.
   */
  handleRowClick() {
    this.props.handleListingSelect(this.props.listing.id, !this.props.selected);
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    const schema = this.props.schema;
    const listingID = this.props.listing.id;
    const listingName = this.props.listing.name;
    const createdAt = Moment(this.props.listing.created_at).calendar();
    const selectClass = this.props.selected ? ' is-selected' : '';
    const writeStatus = this.state.writeStatus;

    if (this.state.editable) {
      return (
        <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
          <td>
            <button type={'button'} className={'emphasize'} onClick={this.handleSaveClick}>Save</button>
            <button type={'button'} className={'default'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td><input ref={this.nameRef} type={'text'} defaultValue={listingName} onClick={e => e.stopPropagation()} />
          </td>
          <td>{createdAt}</td>
          <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
        </tr>
      );
    }

    const classNameMap = this.state.matchingLiveListing ? diffListings(this.state.matchingLiveListing, this.props.listing, ['name']) : {};

    return (
      <tr className={`schema-row${selectClass}`} onClick={this.handleRowClick} title={'Click to select me!'}>
        <td>
          <button type={'button'} className={'emphasize'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Discard</button>
        </td>
        <td className={classNameMap['name']}><Link to={`/pending${schema}/${listingID}`}>{listingName}</Link></td>
        <td>{createdAt}</td>
        <td><StatusLabel writeStatus={writeStatus} schema={schema} /></td>
      </tr>
    );
  }
};
