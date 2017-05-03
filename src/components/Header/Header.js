// @flow
import React from 'react';
import { withRouter } from 'react-router';
import Logout from '../Logout/Logout';
import './Header.css';

type Props = {
  routes: Route[]
};

const DefaultLogo = (): ReactComponent => <div className="Header-logo">Interactive Broadcasting Syndrome</div>;

const Header = ({ routes }: Props): ReactComponent => {
  const currentRoute = routes[routes.length - 1];
  if (currentRoute.hideHeader) return null;
  return (
    <div className="Header">
      <DefaultLogo />
      <Logout />
    </div>
  );
};


export default withRouter(Header);
