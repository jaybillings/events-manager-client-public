import React, {Component} from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import ImportLayout from './layouts/ImportLayout';
import AdminToolsLayout from './layouts/AdminToolsLayout';
import MyAccountLayout from './layouts/MyAccountLayout';
import EventsLayout from './layouts/collections/EventsLayout';
import SingleEventLayout from './layouts/single/SingleEventLayout';
import VenuesLayout from './layouts/collections/VenuesLayout';
import SingleVenueLayout from './layouts/single/SingleVenueLayout';
import OrganizersLayout from './layouts/collections/OrganizersLayout';
import SingleOrganizerLayout from './layouts/single/SingleOrganizerLayout';
import NeighborhoodsLayout from './layouts/collections/NeighborhoodsLayout';
import SingleNeighborhoodLayout from './layouts/single/SingleNeighborhoodLayout';
import TagsLayout from './layouts/collections/TagsLayout';
import SingleTagLayout from './layouts/single/SingleTagLayout';
import NotFound from './pages/NotFound';
import SinglePendingEventLayout from './layouts/single/SinglePendingEventLayout';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route exact path={'/(import)?'} component={ImportLayout}/>

          <Route exact path={'/events'} component={EventsLayout}/>
          <Route exact path={'/events/:id'} component={SingleEventLayout}/>

          <Route exact path={'/venues'} component={VenuesLayout}/>
          <Route exact path={'/venues/:id'} component={SingleVenueLayout}/>

          <Route exact path={'/organizers'} component={OrganizersLayout}/>
          <Route exact path={'/organizers/:id'} component={SingleOrganizerLayout}/>

          <Route exact path={'/neighborhoods'} component={NeighborhoodsLayout}/>
          <Route exact path={'/neighborhoods/:id'} component={SingleNeighborhoodLayout}/>

          <Route exact path={'/tags'} component={TagsLayout}/>
          <Route exact path={'/tags/:id'} component={SingleTagLayout}/>

          <Route exact path={'/pendingEvents/:id'} component={SinglePendingEventLayout} />

          <Route exact path={'/account'} component={MyAccountLayout}/>
          <Route exact path={'/admin'} component={AdminToolsLayout}/>

          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
