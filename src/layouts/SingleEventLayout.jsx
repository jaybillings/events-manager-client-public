import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class SingleEventLayout extends Component {
  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Event Name</h2>
      </div>
    );
  }
};
