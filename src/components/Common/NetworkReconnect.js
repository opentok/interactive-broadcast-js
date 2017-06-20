// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import './NetworkReconnect.css';

type Props = {
  broadcast: BroadcastState
};

const ReconnectionOverlay = (): ReactComponent =>
  <div className="ReconnectionOverlay">
    <div className="ReconnectionMask">
      <div className="ReconnectionText">Attempting to reconnect you...</div>
      <div className="ReconnectionIcon" />
    </div>
  </div>;

const NetworkReconnect = (props: Props): ReactComponent => {
  const { reconnecting, disconnected } = props.broadcast;
  const shouldDisplay = reconnecting && !disconnected;
  return (
    <div className="NetworkReconnect">
      { shouldDisplay && <ReconnectionOverlay /> }
    </div>
  );
};

const mapStateToProps = (state: State): Props => ({
  broadcast: R.prop('broadcast', state),
});

export default connect(mapStateToProps, null)(NetworkReconnect);
