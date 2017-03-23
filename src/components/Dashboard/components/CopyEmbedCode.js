// @flow
import React, { Component } from 'react';
import R from 'ramda';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../Common/CopyToClipboard';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';
import './CopyEmbedCode.css';

type Props = {
  onCopy: string => void
};

class CopyEmbedCode extends Component {

  props: Props;
  state: {
    expanded: boolean
  }
  handleClickOutside: Unit;
  handleCopy: (string) => void;
  toggleExpanded: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: false,
    };
    this.handleCopy = this.handleCopy.bind(this);
    this.toggleExpanded = this.toggleExpanded.bind(this);
  }

  handleCopy(type: string) {
    const { onCopy } = this.props;
    this.toggleExpanded();
    onCopy(type);
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

    const { handleCopy, toggleExpanded } = this;
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
