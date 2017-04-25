// @flow
import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import App from './components/App/App';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Users from './components/Users/Users';
import UpdateEvent from './components/UpdateEvent/UpdateEvent';
import Producer from './components/Broadcast/Producer/Producer';
import AuthRoutes from './components/AuthRoutes/AuthRoutes';
import CelebrityHost from './components/Broadcast/CelebrityHost/CelebrityHost';
import Fan from './components/Broadcast/Fan/Fan';

const routes = (
  <Router history={browserHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="login" />
      <Route path="login" component={Login} />
      <Route path="/show/:adminId/:fanUrl" component={Fan} hideHeader userType={'fan'} />
      <Route path="/show-host/:adminId/:hostUrl" component={CelebrityHost} hideHeader userType={'host'} />
      <Route path="/show-celebrity/:adminId/:celebrityUrl" component={CelebrityHost} hideHeader userType={'celebrity'} />
      <Route component={AuthRoutes}>
        <Route path="admin" component={Dashboard} />
        <Route path="users" component={Users} />
        <Route path="events/new" component={UpdateEvent} />
        <Route path="events/:id/edit" component={UpdateEvent} />
        <Route path="events/:id" component={Producer} />
      </Route>
    </Route>
  </Router>);

export default routes;
