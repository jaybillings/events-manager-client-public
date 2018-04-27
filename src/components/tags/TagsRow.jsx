import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {friendlyDate} from '../../utilities';
import app from '../../services/socketio';

export default class TagsRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false};
    this.tagsService = app.service('tags');

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.saveTag = this.saveTag.bind(this);
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  deleteTag() {
    // TODO: Restrict to admins
    this.tagsService.remove(this.props.tag.id).then(message => console.log('remove', message));
  }

  saveTag() {
    const newData = {name: this.refs.nameInput.value.trim()};

    this.tagsService.patch(this.props.tag.id, newData).then(message => console.log('patch', message));
    this.setState({editable: false});
  }

  render() {
    const tag = this.props.tag;
    const updatedAt = friendlyDate(tag.updated_at);

    if (this.state.editable) {
      return (
        <tr>
          <td>
            <button type={'button'} onClick={this.saveTag}>Save</button>
            <button type={'button'} onClick={this.cancelEdit}>Cancel</button>
          </td>
          <td>
            <input type={'text'} ref={'nameInput'} defaultValue={tag.name}/>
          </td>
          <td>{updatedAt}</td>
        </tr>
      );
    }

    return (
      <tr>
        <td>
          <button type={'button'} onClick={this.startEdit}>Edit</button>
          <button type={'button'} onClick={this.deleteTag}>Delete</button>
        </td>
        <td><Link to={`/tags/${tag.id}`}>{tag.name}</Link></td>
        <td>{updatedAt}</td>
      </tr>
    );
  }
};
