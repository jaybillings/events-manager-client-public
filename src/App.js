import React, {Component} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import ImportLayout from "./layouts/ImportLayout";
import EventsLayout from "./layouts/EventsLayout";
import AdminToolsLayout from "./layouts/AdminToolsLayout";
import MyAccountLayout from "./layouts/MyAccountLayout";
import VenuesLayout from "./layouts/VenuesLayout";
import OrganizersLayout from "./layouts/OrganizersLayout";
import NeighborhoodsLayout from "./layouts/NeighborhoodsLayout";
import CategoriesLayout from "./layouts/CategoriesLayout";
import SingleEventLayout from "./layouts/SingleEventLayout";
import SingleVenueLayout from "./layouts/SingleVenueLayout";
import SingleOrganizerLayout from "./layouts/SingleOrganizerLayout";
import NotFound from "./pages/NotFound";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path="/(import)?" component={ImportLayout}/>
          <Route exact path="/events" component={EventsLayout}/>
          <Route exact path={'/events/:id'} component={SingleEventLayout}/>
          <Route exact path={'/venues'} component={VenuesLayout}/>
          <Route exact path={'/venues/:id'} component={SingleVenueLayout}/>
          <Route exact path={'/organizers'} component={OrganizersLayout}/>
          <Route exact path={'/organizers/:id'} component={SingleOrganizerLayout}/>
          <Route exact path={'/neighborhoods'} component={NeighborhoodsLayout}/>
          <Route exact path={'/categories'} component={CategoriesLayout}/>
          <Route exact path="/account" component={MyAccountLayout}/>
          <Route exact path="/admin" component={AdminToolsLayout}/>
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
