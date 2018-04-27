import React, {Component} from 'react';

import Header from "../../components/common/Header";

export default class CategoriesLayout extends Component {
  render() {
    return (
      <div className="container">
        <Header/>
        <h2>Categories</h2>
        <h3>View/Modify</h3>
        <h3>Add New Category</h3>
      </div>
    );
  }
};
