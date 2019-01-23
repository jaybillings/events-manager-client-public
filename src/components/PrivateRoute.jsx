import React, {Component} from 'react';
import {Redirect, Route} from "react-router";
import app from '../services/socketio';
import Header from "./common/Header";

/**
 * PrivateRoute is a custom route component for routes that require authentication. If authentication fails, the client
 * is redirected to the login page.
 */
export default class PrivateRoute extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  /**
   * Runs after the component mounts. Authenticates the user and registers listeners for auth related events.
   * @override
   */
  componentDidMount() {
    app.authenticate().catch((err) => {
      console.log('login error', err);
      this.setState({login: null});
    });

    app
      .on('authenticated', login => {
        this.setState({login});
      })
      .on('reauthentication-error', msg => {
        app.authenticate().then(() => {
          console.log('=== reconnected ====\n' + msg)
        });
      })
      .on('logout', () => {
        this.setState({login: null});
      });
  }

  /**
   * Renders the component. If successfully authenticated, renders the requested route. If auth is undefined
   * (i.e. authentication has not completed), renders a message. If auth fails, renders a redirect to the login page.
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
              <p style={{'fontWeight':'700','color':'var(--dull-orange)'}}>Authenticating...</p>
            </div>
          );
        } else if (this.state.login) return <Component {...props} login={this.state.login} />;

        return <Redirect to={`/login${this.props.location.pathname}`} />;
      }} />
    );
  }
}
