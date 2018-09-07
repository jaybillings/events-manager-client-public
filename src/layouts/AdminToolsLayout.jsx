import React, {Component} from 'react';

import Header from '../components/common/Header';
import AdminExport from './admin/AdminExport';

export default class AdminToolsLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Admin Tools</h2>
        <h3>Manage Users</h3>
        <h3>Import/Export</h3>
        <AdminExport />
        <h3>Create API Buckets</h3>
      </div>
    );
  }
};
