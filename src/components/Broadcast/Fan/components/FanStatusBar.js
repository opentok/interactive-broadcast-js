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
    case 'inLine':
      statusText = 'You Are In Line';
      statusClass = 'lightBlue';
      break;
    case 'backstage':
      statusText = 'You Are In Backstage';
      statusClass = 'blue';
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
