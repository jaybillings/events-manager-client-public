import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class VenuesLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Venues</h2>
        <h3>View/Modify</h3>
        <h3>Add New Venue</h3>
      </div>
    );
  }
};
