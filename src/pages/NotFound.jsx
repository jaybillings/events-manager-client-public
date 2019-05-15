import React, {Component} from 'react';
import image from '../img/goat-bucket-head.jpg';
import Header from "../components/common/Header";

export default class NotFound extends Component {
  render() {
    /** TODO: Make sure this doesn't redirect too many times */
    return (
      <div className={'container'}>
        <Header/>
        <h2>Page Not Found</h2>
        <p>Sorry, that page doesn't exist. To apologize, here's a goat with a bucket
          on its head.</p>
        <img src={image} alt={'This goat has a bucket on its head'} />
      </div>
    );
  }
};
