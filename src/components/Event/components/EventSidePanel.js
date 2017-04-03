// @flow
import React from 'react';
import classNames from 'classnames';
import './EventSidePanel.css';

type Props = { hidden: boolean };
const EventSidePanel = ({ hidden }: Props): ReactComponent =>
  <div className={classNames('EventSidePanel', { hidden })} >
    <h4 className="EventSidePanel-header">Active Fans</h4>
    <div className="EventSidePanel-fan-list">
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

export default EventSidePanel;
