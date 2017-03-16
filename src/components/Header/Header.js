// @flow
import React from 'react';
import Logout from '../Logout/Logout';
import './Header.css';

const DefaultLogo = (): ReactComponent => <div className="Header-logo">Interactive Broadcasting Syndrome</div>;

const Header = (): ReactComponent =>
  <div className="Header">
    <DefaultLogo />
    <Logout />
  </div>;

export default Header;
