// @flow
import React from 'react';
import classNames from 'classnames';
import './FanStatusBar.css';

type Props = {
  fanStatus: FanStatus
};

const FanStatusBar = (props: Props): ReactComponent => {
  const { fanStatus } = props;
  let statusText = '';
  let statusClass = '';
  switch (fanStatus) {
    case 'connecting':
      statusText = 'Connecting ...';
      statusClass = 'lightBlue';
      break;
    case 'disconnecting':
      statusText = 'Leaving The Line...';
      statusClass = 'lightBlue';
      break;
    case 'inLine':
      statusText = 'You Are In Line';
      statusClass = 'lightBlue';
      break;
    case 'backstage':
      statusText = 'You Are In Backstage';
      statusClass = 'blue';
      break;
    case 'stage':
      statusText = 'You Are On Stage';
      statusClass = 'green';
      break;
    default:
      statusText = '';
      break;
  }
  const classes = classNames('FanStatusBar', statusClass);
  if (!statusText) return <div />;
  return (<div className={classes}>{statusText}</div>);
};

export default FanStatusBar;
