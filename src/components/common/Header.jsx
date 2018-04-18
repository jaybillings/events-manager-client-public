import React, {Component} from 'react';
import { NavLink } from 'react-router-dom';

import "../../styles/Header.less";

export default class Header extends Component {
  render() {
    return(
      <div className="container">
        <header><h1>Visit Seattle Events Manager</h1></header>
        <nav>
          <ul>
            <li><NavLink to={`/import/`} activeClassName="current" isActive={function(match, location) {
              return location.pathname === '/' || location.pathname.search('import') > -1;
            }} title="Import">Import</NavLink></li>
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
