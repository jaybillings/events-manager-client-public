import React, {Component} from 'react';

import Header from '../components/common/Header';

export default class ImportLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header />
        <h2>Import</h2>
        <h3>Import Data From File</h3>
        <h3>Review Unpublished Data</h3>
        <h3>Publish</h3>
      </div>
    );
  }
};
