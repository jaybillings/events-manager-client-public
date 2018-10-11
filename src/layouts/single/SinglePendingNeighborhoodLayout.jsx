import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingNeighborhoodRecord from '../../components/pendingNeighborhoods/PendingNeighborhoodRecord';

export default class SinglePendingNeighborhoodLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {pendingNeighborhood: {}, hoodLoaded: false, hasDeleted: false, notFound: false};

    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.deleteNeighborhood = this.deleteNeighborhood.bind(this);
    this.saveNeighborhood = this.saveNeighborhood.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({hoodLoaded: false});

    // Register listeners
    this.pendingHoodsService
      .on('patched', message => {
        this.setState({pendingNeighborhood: message, hoodLoaded: true});
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.pendingHoodService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingHoodsService.get(id).then(message => {
      this.setState({pendingNeighborhood: message, hoodLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  deleteNeighborhood(id) {
    this.pendingHoodsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveNeighborhood(id, newData) {
    this.pendingHoodsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', JSON.stringify(err));
    });
  }

  renderRecord() {
    if (!this.state.hoodLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingNeighborhoodRecord pendingNeighborhood={this.state.pendingNeighborhood}
                                      saveNeighborhood={this.saveNeighborhood}
                                      deleteNeighborhood={this.deleteNeighborhood} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    return (
      <div className={'container'}>
        <Header />
        <div className={'block-warning'}
             title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingNeighborhood.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
