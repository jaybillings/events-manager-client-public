import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class EventsLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Events</h2>
        <h3>View/Modify</h3>
        <h3>Add New Event</h3>
      </div>
    );
  }
};
