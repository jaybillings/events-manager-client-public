import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class SingleOrganizerLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Organizer Name</h2>
      </div>
    );
  }
};
