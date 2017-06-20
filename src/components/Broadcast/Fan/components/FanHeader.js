// @flow
import React from 'react';
import classNames from 'classnames';
import './FanHeader.css';

type Props = {
  name: string,
  status: EventStatus,
  ableToJoin: boolean,
  inPrivateCall: boolean,
  getInLine: Unit,
  leaveLine: Unit,
  backstageConnected: boolean,
  disconnected: boolean
};
const FanHeader = (props: Props): ReactComponent => {
  const { name, status, ableToJoin, getInLine, leaveLine, backstageConnected, inPrivateCall, disconnected } = props;
  const getInLineButton = (): ReactComponent =>
    !backstageConnected ?
      <button className="btn green getInLine" onClick={getInLine}>Get In Line</button> :
      <button className="btn red getInLine" onClick={leaveLine}>Leave Line</button>;

  return (
    <div className="FanHeader">
      <div className="FanHeader-main">
        <h4>{name}<sup>{status === 'notStarted' ? 'NOT STARTED' : status}</sup></h4>
        { ableToJoin && status !== 'closed' &&
          <div>
            { getInLineButton() }
          </div>
        }
      </div>
      <div className={classNames('Fan-private-call', { active: !!inPrivateCall })}>
        You are in a private call with the Producer
      </div>
      <div className={classNames('Fan-private-call', { active: !!disconnected })}>
        Unable to establish connection, please check your network connection and refresh.
      </div>
    </div>
  );
};

export default FanHeader;
