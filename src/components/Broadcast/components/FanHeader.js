// @flow
import React from 'react';
import classNames from 'classnames';
import './FanHeader.css';

const FanHeader = (props: Props): ReactComponent => {
  const { userType, name, status, togglePublishOnly, publishOnlyEnabled } = props;
  const btnClass = classNames('btn action', { red: !publishOnlyEnabled }, { green: publishOnlyEnabled });
  return (
    <div className="FanHeader">
      <div className="Title">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        { status !== 'closed' &&
          <div>
            <button className={btnClass} onClick={togglePublishOnly}>PUBLISH ONLY {publishOnlyEnabled ? 'ON' : 'OFF'}</button>
          </div>
        }
        <ul>
          <li>
            <span>{userType}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FanHeader;
