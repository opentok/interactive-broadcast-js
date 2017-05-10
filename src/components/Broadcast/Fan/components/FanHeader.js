// @flow
import React from 'react';
import './FanHeader.css';

type Props = {
  name: string,
  status: EventStatus,
  ableToJoin: boolean,
  getInLine: Unit
};
const FanHeader = (props: Props): ReactComponent => {
  const { name, status, ableToJoin, getInLine } = props;
  return (
    <div className="FanHeader">
      <div className="Title">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        { ableToJoin &&
          <ul>
            <li>
              <button className="btn green getInLine" onClick={getInLine}>Get In Line</button>
            </li>
          </ul>
        }
      </div>
    </div>
  );
};

export default FanHeader;
