// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import CopyToClipboard from 'react-copy-to-clipboard';
import { toastr } from 'react-redux-toastr';
import CopyEmbedCode from './CopyEmbedCode';
import './DashboardHeader.css';

/* beautify preserve:start */
type Props = {
  user: User
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

  onCopy = (type: string) => {
    toastr.success('Success', `${type} coped to clipboard`, { icon: 'success' });
  }

  toggleEmbedMenu() {
    const { embedMenuOpen } = this.state;
    this.setState({ embedMenuOpen: !embedMenuOpen });
  }

  render(): ReactComponent {
    const { onCopy } = this;
    const { user } = this.props;
    return (
      <div className="DashboardHeader">
        <h3>Dashboard</h3>
        <div className="DashboardHeader-controls">
          <CopyEmbedCode onCopy={onCopy} />
          <CopyToClipboard text={user.id} onCopy={R.partial(onCopy, ['User ID'])} >
            <button className="btn white control">Copy User ID</button>
          </CopyToClipboard>
          <button className="btn white control">other</button>
          <button className="btn white control">other</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: { user: User }): Props => R.pick(['user'], state);
export default connect(mapStateToProps)(DashboardHeader);
