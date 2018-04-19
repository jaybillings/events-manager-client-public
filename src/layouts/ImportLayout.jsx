import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class ImportLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header location/>
        <h2>Import</h2>
      </div>
    );
  }
};
