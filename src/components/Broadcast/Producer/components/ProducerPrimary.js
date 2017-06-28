// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import Particpant from './Participant';
import { properCase } from '../../../../services/util';
import './ProducerPrimary.css';

const inPrivateCallWith = (privateCall: PrivateCallState, activeFans: ActiveFans): string => {
  const isWith = R.prop('isWith', privateCall);
  const fanId = R.prop('fanId', privateCall);
  const name = R.path(['map', fanId, 'name'], activeFans);
  if (R.equals('activeFan', isWith)) {
    return properCase(name);
  } else if (R.equals('fan', isWith)) {
    return `the Fan - ${name}`;
  } else if (R.equals('backstageFan', isWith)) {
    return `the Backstage Fan - ${name}`;
  }
  return `the ${properCase(isWith)}`;
};

/* beautify preserve:start */
type Props = {
  broadcast: BroadcastState
};
/* beautify preserve:end */

const ProducerPrimary = (props: Props): ReactComponent => {
  const { privateCall, viewers, interactiveLimit, activeFans, disconnected, elapsedTime } = props.broadcast;
  return (
    <div className="ProducerPrimary admin-page-content">
      <div className="ProducerPrimary-info">
        <div className="viewers">
          <Icon name="user" /> {interactiveLimit ? `Viewers ${viewers} / ${interactiveLimit}` : 'Retrieving viewers . . .'}
        </div>
        <div className="time"><Icon name="clock-o" /> Elapsed time {elapsedTime}</div>
        <div className={classNames('private-call', { active: !!privateCall })}>
          You are in a private call with { privateCall ? inPrivateCallWith(privateCall, activeFans) : '...' }
        </div>
        <div className={classNames('private-call', { active: !!disconnected })}>
          Unable to establish connection, please check your network connection and refresh.
        </div>
      </div>
      <div className="ProducerPrimary-participants">
        <Particpant type="backstageFan" />
        <Particpant type="fan" />
        <Particpant type="host" />
        <Particpant type="celebrity" />
        <div id="videoproducer" className="producerContainer" />
      </div>
    </div>
  );
};


const mapStateToProps = (state: State): Props => ({
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

// Need withRouter???
export default withRouter(connect(mapStateToProps)(ProducerPrimary));
