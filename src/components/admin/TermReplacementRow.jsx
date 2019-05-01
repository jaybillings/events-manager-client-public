import React, {Component} from 'react';
import Moment from 'moment';

export default class TermReplacementRow extends Component {
  constructor(props) {
    super(props);

    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleRunClick = this.handleRunClick.bind(this);
  }

  handleDeleteClick() {
    this.props.deleteRow(this.props.lookup.id);
  }

  handleRunClick() {
    this.props.runReplacement(
      this.props.lookup[this.props.termToReplaceRowName],
      this.props.listing.uuid
    );
  }

  render() {
    // TODO: Add edit date
    const termToReplace = this.props.lookup ? this.props.lookup[this.props.termToReplaceRowName] : '';
    const listingName = this.props.listing ? this.props.listing.name : '';
    const createdAt = Moment(this.props.lookup.created_at).calendar();

    return (
      <tr className={'schema-row'}>
        <td>
          <button type={'button'} onClick={this.handleRunClick}>Run Replacement</button>
          <button type={'button'} className={'warn'} onClick={this.handleDeleteClick}>Delete</button>
        </td>
        <td>{termToReplace}</td>
        <td>{listingName}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
};
