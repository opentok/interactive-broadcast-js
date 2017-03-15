// @flow
import React from 'react';
import { Router, Route, IndexRedirect, browserHistory } from 'react-router';
import App from './components/App/App';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';

const routes = (
  <Router history={browserHistory}>
    <Route path="/" component={App} >
      <IndexRedirect to="/login" />
      <Route path="login" component={Login} />
      <Route path="admin" component={Dashboard} />
    </Route>
  </Router>);

export default routes;
