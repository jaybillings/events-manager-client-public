import React, {Component} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import ImportLayout from './layouts/ImportLayout';
import EventsLayout from './layouts/collections/EventsLayout';
import AdminToolsLayout from './layouts/AdminToolsLayout';
import MyAccountLayout from './layouts/MyAccountLayout';
import VenuesLayout from './layouts/collections/VenuesLayout';
import OrganizersLayout from './layouts/collections/OrganizersLayout';
import NeighborhoodsLayout from './layouts/collections/NeighborhoodsLayout';
import CategoriesLayout from './layouts/collections/CategoriesLayout';
import SingleEventLayout from './layouts/single/SingleEventLayout';
import SingleVenueLayout from './layouts/single/SingleVenueLayout';
import SingleOrganizerLayout from './layouts/single/SingleOrganizerLayout';
import NotFound from './pages/NotFound';
import SingleNeighborhoodLayout from './layouts/single/SingleNeighborhoodLayout';

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
          <Route exact path={'/neighborhoods/:id'} component={SingleNeighborhoodLayout}/>
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
