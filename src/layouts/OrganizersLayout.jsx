import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import OrganizersTable from '../components/organizers/OrganizersTable';
import OrganizerAddForm from '../components/organizers/OrganizerAddForm';

export default class OrganizersLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {organizers: [], orgsLoaded: false};

    this.orgsService = app.service('organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.orgsService
      .on('created', message => {
        console.log('created', message);
        this.fetchAllData();
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.fetchAllData();
      });
  }

  componentWillUnmount() {
    this.orgsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.orgsService.find({
      query: {
        $sort: {updated_at: -1},
        $limit: 25
      }
    }).then(message => {
      this.setState({organizers: message.data, orgsLoaded: true});
    });
  }

  renderTable() {
    if (!this.state.orgsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <OrganizersTable organizers={this.state.organizers}/>
  }

  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Organizers</h2>
        <h3>View/Modify</h3>
        {this.renderTable()}
        <h3>Add New Organizer</h3>
        <OrganizerAddForm/>
      </div>
    );
  }
};
