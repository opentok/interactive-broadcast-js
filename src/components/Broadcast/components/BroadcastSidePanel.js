// @flow
import React from 'react';
import classNames from 'classnames';
import './BroadcastSidePanel.css';

type Props = { hidden: boolean };
const BroadcastSidePanel = ({ hidden }: Props): ReactComponent =>
  <div className={classNames('BroadcastSidePanel', { hidden })} >
    <h4 className="BroadcastSidePanel-header">Active Fans</h4>
    <div className="BroadcastSidePanel-fan-list">
      <ul>
        <li>adsf</li>
        <li>adf</li>
        <li>adf</li>
        <li>asdf</li>
        <li>asdf</li>
        <li>adfasd</li>
      </ul>
    </div>
  </div>;

export default BroadcastSidePanel;
