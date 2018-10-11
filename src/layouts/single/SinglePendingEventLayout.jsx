import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingEventRecord from '../../components/pendingEvents/PendingEventRecord';

export default class SinglePendingEventLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pendingEvent: {}, eventLoaded: false, hasDeleted: false, notFound: false
    };

    this.pendingEventsService = app.service('pending-events');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveEvent = this.saveEvent.bind(this);
    this.deleteEvent = this.deleteEvent.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({eventLoaded: false});

    // Register listeners
    this.pendingEventsService
      .on('patched', message => {
        this.setState({pendingEvent: message, eventLoaded: true});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.pendingEventsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingEventsService.get(id).then(message => {
      this.setState({pendingEvent: message, eventLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteEvent(id) {
    this.pendingEventsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveEvent(id, newData) {
    // TODO: Add message window
    this.pendingEventsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', JSON.stringify(err));
    });
  }

  renderRecord() {
    if (!this.state.eventLoaded) return <p>Data is loading ... Please be patient...</p>;

    return <PendingEventRecord pendingEvent={this.state.pendingEvent} saveEvent={this.saveEvent}
                               deleteEvent={this.deleteEvent} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/import'} />;

    return (
      <div className={'container'}>
        <Header />
        <div className={'block-warning'}
             title={'Caution: This event is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingEvent.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
};
