// @flow
import React from 'react';
import classNames from 'classnames';
import './ProducerSidePanel.css';

type Props = { hidden: boolean };
const ProducerSidePanel = ({ hidden }: Props): ReactComponent =>
  <div className={classNames('ProducerSidePanel', { hidden })} >
    <div className="ProducerSidePanel-header">Active Fans</div>
    <div className="ProducerSidePanel-fan-list">
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

export default ProducerSidePanel;
