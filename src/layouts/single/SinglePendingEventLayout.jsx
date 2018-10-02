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
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.pendingEventsService
      .on('patched', message => {
        this.setState({pendingEvent: message});
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

    this.setState({eventLoaded: false});

    this.pendingEventsService.get(id).then(message => {
      this.setState({pendingEvent: message, eventLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  renderRecord() {
    if (!this.state.eventLoaded) return <p>Data is loading ... Please be patient...</p>;

    return <PendingEventRecord pendingEvent={this.state.pendingEvent} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/import'} />;

    return (
      <div className={'container'}>
        <Header />
        <div>
          <h2>{this.state.pendingEvent.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
};
