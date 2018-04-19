import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class OrganizersLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Organizers</h2>
        <h3>View/Modify</h3>
        <h3>Add New Organizer</h3>
      </div>
    );
  }
};
