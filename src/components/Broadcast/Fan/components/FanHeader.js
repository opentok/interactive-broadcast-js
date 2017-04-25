// @flow
import React from 'react';
import './FanHeader.css';

const FanHeader = (props: Props): ReactComponent => {
  const { name, status } = props;
  return (
    <div className="FanHeader">
      <div className="Title">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        <ul>
          <li>
            <span>GET IN THE LINE</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FanHeader;
