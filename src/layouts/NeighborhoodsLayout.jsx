import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class NeighborhoodsLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Neighborhoods</h2>
        <h3>View/Modify</h3>
        <h3>Add New Neighborhood</h3>
      </div>
    );
  }
};
