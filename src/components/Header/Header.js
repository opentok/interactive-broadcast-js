// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Logout from '../Logout/Logout';
import './Header.css';

const DefaultLogo = (): ReactComponent => <div className="Header-logo">Interactive Broadcasting Syndrome</div>;

class Header extends Component {
  render(): ReactComponent {
    return (
      <div className="Header">
        <DefaultLogo />
        <Logout />
      </div>
    );
  }
}

export default Header;
