import React, {Component} from 'react';

import Header from '../components/common/Header';

export default class AdminToolsLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Admin Tools</h2>
        <h3>Manage Users</h3>
        <h3>Import/Export</h3>
        <a className="button" href={'http://localhost:3030/exporter/json'} target={'_blank'}>Export All Data</a>
        <h3>Create API Buckets</h3>
      </div>
    );
  }
};
