import React, {Component} from 'react';
import {Redirect, Route} from "react-router-dom";
import app from '../services/socketio';
import {printToConsole} from "../utilities";

import Header from "./common/Header";

/**
 * PrivateRoute is a custom route component for routes that require authentication.
 * If authentication fails, the client is redirected to the login page.
 * @class
 */
export default class PrivateRoute extends Component {
  constructor(props) {
    super(props);

    /** @note `login` is intentionally uninitialized. */
    this.state = {};
  }

  /**
   * Runs after the component mounts. Authenticates the user and registers listeners
   *
   * for auth related events.
   * @override
   */
  componentDidMount() {
    app.authenticate().catch((err) => {
      this.setState({login: null});
      printToConsole(err, 'error');
    });

    app
      .on('authenticated', login => {
        app.passport.verifyJWT(login.accessToken)
          .then(payload => {
            return app.service('users').get(payload.userId);
          })
          .then(user => {
            user.is_admin = user.permissions.indexOf('admin') !== -1;
            user.is_su = user.is_admin || user.permissions.indexOf('super_user') !== -1;
            app.set('user', user);
            this.setState({login});
          })
          .catch(err => {
            printToConsole(err, 'error');
          });
      })
      .on('reauthentication-error', () => {
        app.authenticate().then(() => {
          printToConsole('log', '==== reconnected ===');
        });
      })
      .on('logout', () => {
        this.setState({login: null});
      });
  }

  /**
   * Runs before the component unmounts. Unregisters service listeners.
   *
   * @override
   */
  componentWillUnmount() {
    app
      .removeAllListeners('authenticated')
      .removeAllListeners('reauthentication-error')
      .removeAllListeners('accountLogout');
  }

  /**
   * Renders the component.
   *
   * If successfully authenticated, this renders the requested route. If auth is undefined
   * (i.e. authentication has not completed), renders a message. If auth fails,
   * renders a redirect to the login page.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const {component: Component, ...rest} = this.props;

    return (
      <Route {...rest} render={props => {
        if (this.state.login === undefined) {
          return (
            <div className={'container'}>
              <Header />
              <p className={'single-message emphasize'}>Authenticating...</p>
            </div>
          );
        }
        else if (this.state.login) return <Component {...props} />;

        return <Redirect to={`/login${this.props.location.pathname}`} />;
      }} />
    );
  }
}
