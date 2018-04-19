import React, {Component} from 'react';

import Header from "../components/common/Header";

export default class MyAccountLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header/>
        <h2>My Account</h2>
        <h3>Update Account Info</h3>
        <h4>Update Name</h4>
        <h4>Update Password</h4>
        <h3>Delete Account</h3>
      </div>
    );
  }
};
