import React, {Component} from 'react';
import {NavLink} from 'react-router-dom';
import app from '../../services/socketio';

import "../../styles/header.css";

/**
 * `Header` component displays the app's header, including primary navigation.
 *
 * @class
 */
export default class Header extends Component {
  constructor(props) {
    super(props);

    this.user = app.get('user');

    this.renderAccountLinks = this.renderAccountLinks.bind(this);
  }

  /**
   * `renderAccountLinks` renders secondary links having to do with authentication and
   * account management.
   *
   * @returns {*[]}
   */
  renderAccountLinks() {
    const accountLinks = this.user
      ? [<NavLink to={`/account`} activeClassName={'current'}>{this.user.email}'s Account</NavLink>]
      : [<NavLink to={'/recoverPassword'} activeClassName={'current'}>Recover Lost Password</NavLink>,
        <NavLink to={'/login'} activeClassName={'current'}>Log In/Create Account</NavLink>];

    return accountLinks.map((link, index) => {
      return <li key={`account-link-${index}`} className={'smaller'}>{link}</li>
    });
  }

  /**
   * Renders the component.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const adminToolsLink = this.user && this.user.is_admin ?
      <li><NavLink to={`/admin/`} activeClassName={'current'}>Admin Tools</NavLink></li> : '';

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
            {adminToolsLink}
            {this.renderAccountLinks()}
          </ul>
        </nav>
      </header>
    );
  }
}
