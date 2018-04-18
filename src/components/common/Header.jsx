import React, {Component} from 'react';

export default class Header extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div className="container">
        <header><h1>Visit Seattle Events Manager</h1></header>
        <nav>
          <ul>
            <li>Imports</li>
          </ul>
          <ul>
            <li>Events</li>
            <li>Venues</li>
            <li>Organizers</li>
            <li>Neighborhoods</li>
            <li>Categories</li>
          </ul>
          <ul>
            <li>My Account</li>
            <li>Export</li>
          </ul>
        </nav>
      </div>
    );
  }
}
