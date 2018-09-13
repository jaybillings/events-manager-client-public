import React, {Component} from 'react';
import Moment from 'moment';
import app from '../../services/socketio';

import '../../styles/schema-record.css';

export default class OrganizerRecord extends Component {
  constructor(props) {
    super(props);

    this.orgsService = app.service('organizers');
    this.state = {hasDeleted: false};

    this.deleteOrganizer = this.deleteOrganizer.bind(this);
    this.saveOrganizer = this.saveOrganizer.bind(this);
  }

  deleteOrganizer() {
    // TODO: Restrict to admins
    const id = this.props.organizer.id;
    this.orgsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveOrganizer(e) {
    e.preventDefault(e);

    const id = this.props.organizer.id;
    const newData = {
      name: this.refs['nameInput'].value.trim(),
      description: this.refs['descInput'].value.trim()
    };

    // Only add non-required if they have a value
    this.refs['urlInput'].value && (newData['url'] = this.refs['urlInput'].value);
    this.refs['phoneInput'].value && (newData['phone'] = this.refs['phoneInput'].value);

    this.orgsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, message => {
      console.log('error', message);
    });
  }

  render() {
    const organizer = this.props.organizer;
    const createdAt = Moment(organizer['created_at']).calendar();
    const updatedAt = Moment(organizer['updated_at']).calendar();

    return (
      <form id={'organizer-listing-form'} className={'schema-record'} onSubmit={this.saveOrganizer}>
        <div>
          <button type={'button'} ref={'deleteButton'} onClick={this.deleteOrganizer}>Delete Organizer</button>
          <button type={'submit'} ref={'submitButton'} className={'button-primary'}>Save Changes</button>
        </div>
        <label>
          ID
          <input type={'text'} defaultValue={organizer.id} disabled/>
        </label>
        <label>
          Created At
          <input type={'text'} defaultValue={createdAt} disabled/>
        </label>
        <label>
          Last Updated
          <input type="text" defaultValue={updatedAt} disabled/>
        </label>
        <label>
          Name
          <input type={'text'} ref={'nameInput'} defaultValue={organizer.name}/>
        </label>
        <label>
          Description
          <textarea ref={'descInput'} defaultValue={organizer.description}/>
        </label>
        <label>
          Url
          <input type={'url'} ref={'urlInput'} defaultValue={organizer.url} />
        </label>
        <label>
          Phone #
          <input type={'tel'} ref={'phoneInput'} defaultValue={organizer.phone} />
        </label>
      </form>
    );
  }
};
