import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import ImportLayout from "./layouts/ImportLayout";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
          <Switch>
              <Route exact path="/(import)?" component={ImportLayout} />
          </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
