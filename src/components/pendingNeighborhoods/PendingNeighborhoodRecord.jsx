import React, {Component} from 'react';
import Moment from 'moment';

import '../../styles/schema-record.css';
import '../../styles/toggle.css';

export default class PendingNeighborhoodRecord extends Component {
  constructor(props) {
    super(props);

    this.nameInput = React.createRef();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClickDelete = this.handleClickDelete.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const id = this.props.pendingNeighborhood.id;
    const newData = {name: this.nameInput.current.value.trim()};

    this.props.saveNeighborhood(id, newData);
  }

  handleClickDelete() {
    const id = this.props.pendingNeighborhood.id;
    this.props.deleteNeighborhood(id);
  }

  render() {
    const pendingHood = this.props.pendingNeighborhood;
    const hoodId = pendingHood.target_id || 'N/A';
    const createdAt = Moment(pendingHood.created_at).calendar();
    const updatedAt = Moment(pendingHood.updated_at).calendar();

    return (
      <form id={'pending-hood-listing-form'} className={'schema-record'} onSubmit={this.handleSubmit}>
        <label>
          Live Neighborhood ID
          <input type={'text'} defaultValue={hoodId} disabled />
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
          <input type={'text'} ref={this.nameInput} defaultValue={pendingHood.name} required maxLength={100} />
        </label>
        <div className={'block-warning'} title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <button type="submit" className={'button-primary'}>Save Changes</button>
          <button type="button" onClick={this.handleClickDelete}>Discard Neighborhood</button>
        </div>
      </form>
    );
  }
};
