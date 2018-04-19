import React, {Component} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import ImportLayout from "./layouts/ImportLayout";
import EventsLayout from "./layouts/EventsLayout";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/(import)?" component={ImportLayout}/>
          <Route exact path="/events" component={EventsLayout}/>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
