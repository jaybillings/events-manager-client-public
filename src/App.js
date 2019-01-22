import React, {Component} from 'react';
import {BrowserRouter, Route, Switch} from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';

import ImportLayout from './layouts/ImportLayout';
import AdminToolsLayout from './layouts/AdminToolsLayout';
import MyAccountLayout from './layouts/MyAccountLayout';

import EventsLayout from './layouts/collections/EventsLayout';
import VenuesLayout from './layouts/collections/VenuesLayout';
import OrganizersLayout from './layouts/collections/OrganizersLayout';
import NeighborhoodsLayout from './layouts/collections/NeighborhoodsLayout';
import TagsLayout from './layouts/collections/TagsLayout';

import SingleEventLayout from './layouts/single/SingleEventLayout';
import SingleVenueLayout from './layouts/single/SingleVenueLayout';
import SingleOrganizerLayout from './layouts/single/SingleOrganizerLayout';
import SingleNeighborhoodLayout from './layouts/single/SingleNeighborhoodLayout';
import SingleTagLayout from './layouts/single/SingleTagLayout';

import SinglePendingEventLayout from './layouts/single/SinglePendingEventLayout';
import SinglePendingVenueLayout from "./layouts/single/SinglePendingVenueLayout";
import SinglePendingOrganizerLayout from './layouts/single/SinglePendingOrganizerLayout';
import SinglePendingNeighborhoodLayout from './layouts/single/SinglePendingNeighborhoodLayout';
import SinglePendingTagLayout from './layouts/single/SinglePendingTagLayout';

import NotFound from './pages/NotFound';
import LoginPage from './pages/LoginPage';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <PrivateRoute exact path={'/(import)?'} component={ImportLayout} />

          <PrivateRoute exact path={'/events'} component={EventsLayout} />
          <PrivateRoute exact path={'/events/:id'} component={SingleEventLayout} />

          <PrivateRoute exact path={'/venues'} component={VenuesLayout} />
          <PrivateRoute exact path={'/venues/:id'} component={SingleVenueLayout} />

          <PrivateRoute exact path={'/organizers'} component={OrganizersLayout} />
          <PrivateRoute exact path={'/organizers/:id'} component={SingleOrganizerLayout} />

          <PrivateRoute exact path={'/neighborhoods'} component={NeighborhoodsLayout} />
          <PrivateRoute exact path={'/neighborhoods/:id'} component={SingleNeighborhoodLayout} />

          <PrivateRoute exact path={'/tags'} component={TagsLayout} />
          <PrivateRoute exact path={'/tags/:id'} component={SingleTagLayout} />

          <PrivateRoute exact path={'/pendingEvents/:id'} component={SinglePendingEventLayout} />
          <PrivateRoute exact path={'/pendingVenues/:id'} component={SinglePendingVenueLayout} />
          <PrivateRoute exact path={'/pendingOrganizers/:id'} component={SinglePendingOrganizerLayout} />
          <PrivateRoute exact path={'/pendingNeighborhoods/:id'} component={SinglePendingNeighborhoodLayout} />
          <PrivateRoute exact path={'/pendingTags/:id'} component={SinglePendingTagLayout} />

          <PrivateRoute exact path={'/account'} component={MyAccountLayout} />
          <PrivateRoute exact path={'/admin'} component={AdminToolsLayout} />

          <Route path={'/login(/:redirectUrl)?'} component={LoginPage} />
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
