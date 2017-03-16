// @flow
import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import App from './components/App/App';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AuthRoutes from './components/AuthRoutes/AuthRoutes';

const routes = (
  <Router history={browserHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="/login" />
      <Route path="login" component={Login} />
      <Route component={AuthRoutes}>
        <Route path="admin" component={Dashboard} />
      </Route>
    </Route>
  </Router>);

export default routes;
