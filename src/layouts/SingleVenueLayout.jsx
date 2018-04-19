import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class SingleVenueLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Venue Name</h2>
      </div>
    );
  }
};
