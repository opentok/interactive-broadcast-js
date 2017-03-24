// @flow
import React, { Component } from 'react';
import Icon from 'react-fontawesome';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';
import CopyToClipboard from '../../Common/CopyToClipboard';

import './CopyEmbedCode.css';

type Props = { };

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
    const fanUrl = 'fan';
    const hostUrl = 'host';
    const celebrityUrl = 'celeb';
    const buttonClass = 'btn white';
    return (
      <div className="CopyEmbedCode">
        <button className={classNames(buttonClass, 'toggle')} onClick={toggleExpanded}>
          Get Embed Code <Icon name="angle-down" size="lg" />
        </button>
        <div className={classNames('CopyEmbedCode-button-container', { expanded })}>
          <CopyToClipboard text={fanUrl} onCopyText="Fan code" >
            <button onClick={toggleExpanded} className={buttonClass}>Get fan code</button>
          </CopyToClipboard>
          <CopyToClipboard text={hostUrl} onCopyText="Host code" >
            <button onClick={toggleExpanded} className={buttonClass}>Get host code</button>
          </CopyToClipboard>
          <CopyToClipboard text={celebrityUrl} onCopyText="Celebrity code" >
            <button onClick={toggleExpanded} className={buttonClass} >Get celebrity code</button>
          </CopyToClipboard>
        </div>
      </div>
    );
  }

}

export default onClickOutside(CopyEmbedCode);
