import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from "../../components/common/Header";
import NeighborhoodsTable from '../../components/neighborhoods/NeighborhoodsTable';
import NeighborhoodAddForm from '../../components/neighborhoods/NeighborhoodAddForm';

export default class NeighborhoodsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {neighborhoods: [], hoodsLoaded: false};
    this.hoodsService = app.service('neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.hoodsService
      .on('created', message => {
        console.log('created', message);
        this.fetchAllData();
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.fetchAllData();
      });
  }

  componentWillUnmount() {
    this.hoodsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.hoodsService.find({query: {$sort: {updated_at: -1}, $limit: 25}})
      .then(message => {
        this.setState({neighborhoods: message.data, hoodsLoaded: true})
      });
  }

  renderTable() {
    if (!this.state.hoodsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <NeighborhoodsTable neighborhoods={this.state.neighborhoods}/>
  }

  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Neighborhoods</h2>
        <h3>View/Modify</h3>
        {this.renderTable()}
        <h3>Add New Neighborhood</h3>
        <NeighborhoodAddForm/>
      </div>
    );
  }
};
