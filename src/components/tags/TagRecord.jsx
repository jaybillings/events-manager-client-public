import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';

import '../../styles/schema-record.css';

export default class TagRecord extends Component {
  constructor(props) {
    super(props);

    this.tagsService = app.service('tags');
    this.state = {hasDeleted: false};

    this.deleteTag = this.deleteTag.bind(this);
    this.saveTag = this.saveTag.bind(this);
  }

  deleteTag() {
    // TODO: Restrict to admins
    const id = this.props.tag.id;
    this.tagsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveTag(e) {
    e.preventDefault();

    const id = this.props.tag.id;
    const newData = {name: this.refs['nameInput'].value.trim()};

    this.tagsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, message => {
      console.log('error', message);
    });
  }

  render() {
    const tag = this.props.tag;
    const createdAt = Moment(tag['created_at']).calendar();
    const updatedAt = Moment(tag['updated_at']).calendar();

    return (
      <form id={'tag-listing-form'} className={'schema-record'} onSubmit={this.saveTag}>
        <div>
          <button type={'button'} ref={'deleteButton'} onClick={this.deleteTag}>Delete Tag</button>
          <button type={'submit'} ref={'submitButton'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          ID
          <input type={'text'} defaultValue={tag.id} disabled />
        </label>
        <label>
          Created At
          <input type={'text'} defaultValue={createdAt} disabled />
        </label>
        <label>
          Last Updated
          <input type={'text'} defaultValue={updatedAt} disabled />
        </label>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} defaultValue={tag.name}/>
        </label>
      </form>
    );
  }
};
