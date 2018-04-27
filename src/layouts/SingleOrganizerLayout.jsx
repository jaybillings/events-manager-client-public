import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../services/socketio';

import Header from "../components/common/Header";
import OrganizerRecord from '../components/organizers/OrganizerRecord';

export default class SingleOrganizerLayout extends Component {
  constructor(props) {
    super(props);

    this.state = { organizer: {}, orgLoaded: false, hasDeleted: false, notFound: false};

    this.orgsService = app.service('organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.orgsService
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.orgsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.setState({orgLoaded: false});

    this.orgsService.get(id).then(message => {
      this.setState({organizer: message, orgLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  renderRecord() {
    if (!this.state.orgLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <OrganizerRecord organizer={this.state.organizer} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/organizers/'} />;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.organizer.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
