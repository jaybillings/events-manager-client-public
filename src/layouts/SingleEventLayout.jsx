import React, {Component} from 'react';
import Header from '../components/common/Header';
import EventRecord from '../components/events/EventRecord';

export default class SingleEventLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Event Name</h2>
        <EventRecord eventId={this.props.match.params.id} />
      </div>
    );
  }
};
