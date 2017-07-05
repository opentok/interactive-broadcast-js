// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import Icon from 'react-fontawesome';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';
import CopyToClipboard from '../../Common/CopyToClipboard';
import createEmbed from '../../../services/createEmbed';

import './CopyEmbedCode.css';

type Props = {
  adminId: string
 };

class CopyEmbedCode extends Component {

  props: Props;
  state: {
    expanded: boolean
  }
  handleClickOutside: Unit;
  toggleExpanded: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
    };
    this.toggleExpanded = this.toggleExpanded.bind(this);
  }

  handleClickOutside() {
    if (this.state.expanded) {
      this.toggleExpanded();
    }
  }

  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  }

  render(): ReactComponent {

    const { toggleExpanded } = this;
    const { expanded } = this.state;
    const fanCode = createEmbed('fan', this.props.adminId);
    const celebrityCode = createEmbed('celebrity', this.props.adminId);
    const hostCode = createEmbed('host', this.props.adminId);
    return (
      <div className="CopyEmbedCode">
        <button className="btn white toggle" onClick={toggleExpanded}>
          Get Embed Code <Icon name="angle-down" size="lg" />
        </button>
        <div className={classNames('CopyEmbedCode-button-container', { expanded })}>
          <CopyToClipboard text={fanCode} onCopyText="Fan code" >
            <button onClick={toggleExpanded} className="btn white">Get fan code</button>
          </CopyToClipboard>
          <CopyToClipboard text={hostCode} onCopyText="Host code" >
            <button onClick={toggleExpanded} className="btn white">Get host code</button>
          </CopyToClipboard>
          <CopyToClipboard text={celebrityCode} onCopyText="Celebrity code" >
            <button onClick={toggleExpanded} className="btn white" >Get celebrity code</button>
          </CopyToClipboard>
        </div>
      </div>
    );
  }
}


const mapStateToProps = (state: State): Props => ({
  adminId: R.path(['currentUser', 'id'], state),
});

export default connect(mapStateToProps)(onClickOutside(CopyEmbedCode));
