// @flow
import React from 'react';
import './FanHeader.css';

type Props = {
  name: string,
  status: EventStatus,
  ableToJoin: boolean,
  getInLine: Unit,
  leaveLine: Unit,
  backstageConnected: boolean
};
const FanHeader = (props: Props): ReactComponent => {
  const { name, status, ableToJoin, getInLine, leaveLine, backstageConnected } = props;
  const getInLineButton = (): ReactComponent =>
    !backstageConnected ?
      <button className="btn green getInLine" onClick={getInLine}>Get In Line</button> :
      <button className="btn red getInLine" onClick={leaveLine}>Leave Line</button>;

  return (
    <div className="FanHeader">
      <div className="Title">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        { ableToJoin && status !== 'closed' &&
          <ul>
            <li>
              {getInLineButton()}
            </li>
          </ul>
        }
      </div>
    </div>
  );
};

export default FanHeader;
