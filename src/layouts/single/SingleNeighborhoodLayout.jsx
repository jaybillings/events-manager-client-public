import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import NeighborhoodRecord from '../../components/neighborhoods/NeighborhoodRecord';

export default class SingleNeighborhoodLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {neighborhood: {}, hoodLoaded: false, hasDeleted: false, notFound: false};
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.hoodsService
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.hoodsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.setState({hoodLoaded: false});

    this.hoodsService.get(id).then(message => {
      this.setState({neighborhood: message, hoodLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  renderRecord() {
    if (!this.state.hoodLoaded) return <p>Data is loading... Please be patient...</p>;

    return <NeighborhoodRecord neighborhood={this.state.neighborhood}/>
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'}/>;

    if (this.state.hasDeleted) return <Redirect to={'/neighborhoods/'}/>;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.neighborhood.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
