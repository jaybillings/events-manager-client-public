import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingOrganizerRecord from '../../components/pendingOrganizers/PendingOrganizerRecord';

export default class SinglePendingOrganizerLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {pendingOrganizer: {}, orgLoaded: false, hasDeleted: false, notFound: false};

    this.pendingOrganizersService = app.service('pending-organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveOrganizer = this.saveOrganizer.bind(this);
    this.deleteOrganizer = this.deleteOrganizer.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({orgLoaded: false});

    // Register listeners
    this.pendingOrganizersService
      .on('patched', message => {
        this.setState({pendingOrganizer: message, orgLoaded: true});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.pendingOrganizersService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingOrganizersService.get(id).then(message => {
      this.setState({pendingOrganizer: message, orgLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteOrganizer(id) {
    this.pendingOrganizersService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveOrganizer(id, newData) {
    this.pendingOrganizersService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
    });
  }

  renderRecord() {
    if (!this.state.orgLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingOrganizerRecord pendingOrganizer={this.state.pendingOrganizer}
                                   saveOrganizer={this.saveOrganizer} deleteOrganizer={this.deleteOrganizer} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    return (
      <div className={'container'}>
        <Header />
        <div className={'block-warning'}
             title={'Caution: This organizer is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingOrganizer.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
