import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import app from '../../services/socketio';

import "../../styles/header.css";

/**
 * The Header component displays the page header and main navigation.
 *
 * @class
 */
export default class Header extends Component {
  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const user = app.get('user');
    const adminNav = user && user.permissions.indexOf('admin') !== -1
      ? <li><NavLink to={`/admin/`} activeClassName={'current'}>Admin Tools</NavLink></li> : '';
    const accountNav = user ? <li><NavLink to={`/account`} activeClassName={'current'}>My Account</NavLink></li>
      : <li><NavLink to={'/login'} activeClassName={'current'}>Log In/Create Account</NavLink></li>;

    return (
      <header>
        <h1>Visit Seattle Events Manager</h1>
        <nav>
          <ul>
            <li><NavLink to={`/import/`} activeClassName={'current'} isActive={function (match, location) {
              return location.pathname === '/' || location.pathname.search('import') !== -1;
            }} title="Import">Import</NavLink></li>
            <li><NavLink to={`/events/`} activeClassName="current">Events</NavLink></li>
            <li><NavLink to={`/venues`} activeClassName="current">Venues</NavLink></li>
            <li><NavLink to={`/organizers/`} activeClassName={'current'}>Organizers</NavLink></li>
            <li><NavLink to={`/neighborhoods/`} activeClassName={'current'}>Neighborhoods</NavLink></li>
            <li><NavLink to={`/tags/`} activeClassName={'current'}>Tags</NavLink></li>
            {adminNav}
            {accountNav}
          </ul>
        </nav>
      </header>
    );
  }
}
