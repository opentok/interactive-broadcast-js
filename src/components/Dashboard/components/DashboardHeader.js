// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Icon from 'react-fontawesome';
import R from 'ramda';
import CopyToClipboard from '../../Common/CopyToClipboard';
import CopyEmbedCode from './CopyEmbedCode';
import './DashboardHeader.css';

/* beautify preserve:start */
type Props = {
  currentUser: User
};
/* beautify preserve:end */

class DashboardHeader extends Component {

  props: Props;
  state: {
    embedMenuOpen: boolean
  }
  onCopy: Unit;
  toggleEmbedMenu: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      embedMenuOpen: false,
    };
    this.toggleEmbedMenu = this.toggleEmbedMenu.bind(this);
  }

  toggleEmbedMenu() {
    const { embedMenuOpen } = this.state;
    this.setState({ embedMenuOpen: !embedMenuOpen });
  }

  render(): ReactComponent {
    const { onCopy } = this;
    const { currentUser } = this.props;
    return (
      <div className="DashboardHeader admin-page-header">
        <h3>Dashboard</h3>
        <div className="DashboardHeader-controls">
          <CopyEmbedCode onCopy={onCopy} />
          <CopyToClipboard text={currentUser.id} onCopyText="User ID" >
            <button className="btn white control">Copy User ID</button>
          </CopyToClipboard>
          <Link to="/events/new">
            <button className="btn white control"><Icon name="plus" />Add New Event</button>
          </Link>
          <Link to="/users">
            <button className="btn white control"><Icon name="user" />Manage Users</button>
          </Link>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: { currentUser: User }): Props => R.pick(['currentUser'], state);
export default connect(mapStateToProps)(DashboardHeader);
