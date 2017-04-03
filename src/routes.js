// @flow
import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import App from './components/App/App';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Users from './components/Users/Users';
import UpdateEvent from './components/UpdateEvent/UpdateEvent';
import Event from './components/Event/Event';
import AuthRoutes from './components/AuthRoutes/AuthRoutes';

const routes = (
  <Router history={browserHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="login" />
      <Route path="login" component={Login} />
      <Route component={AuthRoutes}>
        <Route path="admin" component={Dashboard} />
        <Route path="users" component={Users} />
        <Route path="events/new" component={UpdateEvent} />
        <Route path="events/:id/edit" component={UpdateEvent} />
        <Route path="events/:id" component={Event} />
      </Route>
    </Route>
  </Router>);

export default routes;
