import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';

import "../../styles/Header.css";

export default class Header extends Component {
  render() {
    return (
      <header>
        <h1>Visit Seattle Events Manager</h1>
        <nav>
          <ul>
            <li><NavLink to={`/import/`} activeClassName="current" isActive={function (match, location) {
              return location.pathname === '/' || location.pathname.search('import') !== -1;
            }} title="Import">Import</NavLink></li>
          </ul>
          <ul>
            <li><NavLink to={`/events/`} activeClassName="current">Events</NavLink></li>
            <li><NavLink to={`/venues`} activeClassName="current">Venues</NavLink></li>
            <li><NavLink to={`/organizers/`} activeClassName={'current'}>Organizers</NavLink></li>
            <li><NavLink to={`/neighborhoods/`} activeClassName={'current'}>Neighborhoods</NavLink></li>
            <li><NavLink to={`/categories/`} activeClassName={'current'}>Categories</NavLink></li>
          </ul>
          <ul>
            <li><NavLink to={`/account`} activeClassName={'current'}>My Account</NavLink></li>
            <li><NavLink to={`/admin/`} activeClassName={'current'}>Admin Tools</NavLink></li>
          </ul>
        </nav>
      </header>
    );
  }
}
