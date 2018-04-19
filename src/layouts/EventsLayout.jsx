import React, {Component} from 'react';
import app from '../services/socketio';

import Header from '../components/common/Header';
import EventsTable from "../components/events/EventsTable";
import EventAddForm from "../components/events/EventAddForm";

export default class EventsLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const eventsService = app.service('events');

    eventsService.find({
      query: {
        $sort: {created_at: -1},
        $limit: 25
      }
    }).then((eventsData) => {
      console.log(eventsData.data);
      this.setState({'eventsData': eventsData});
    });
  }

  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Events</h2>
        <h3>View/Modify</h3>
        <EventsTable events={this.state.eventsData}/>
        <h3>Add New Event</h3>
        <EventAddForm/>
      </div>
    );
  }
};
