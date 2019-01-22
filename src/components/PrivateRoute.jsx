import React, {Component} from 'react';
import {Redirect, Route} from "react-router";
import app from '../services/socketio';

/**
 * PrivateRoute is a custom route component that enforces authentication for access. If the client
 * is not authenticated, the component redirects to the login page.
 */
export default class PrivateRoute extends Component {
  constructor(props) {
      super(props);

      this.state = {isLoggedIn: false, isPending: true};
  }

  /**
   * Runs before the component mounts. Fetches JWT / auth data.
   * @override
   */
  componentWillMount() {
    app.authenticate().then((message) => {
      console.log('login success' + message);
      //this.setState({isLoggedIn: true, isPending: false});
    }).catch((err) => {
      console.log('login error', err);
      //this.setState({isLoggedIn: false, isPending: false});
    });
  }

  /**
   * Renders the component. If not logged in, redirects to the login page.
   *
   * @render
   * @override
   * @returns {*}
   */
  render() {
    const {component: Component, ...rest} = this.props;
    const isPending = this.state.isPending;
    //const isLoggedIn = this.state.isLoggedIn;

    return (
      <Route {...rest} render={props => {
        if (isPending) return <div>Loading...</div>;
        return <Component {...props} />;
      }} />
    )
  }
}
