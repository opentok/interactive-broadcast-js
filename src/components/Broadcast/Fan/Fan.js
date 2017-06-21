// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { setBroadcastEventStatus } from '../../../actions/broadcast';
import { initializeBroadcast, getInLine, leaveTheLine } from '../../../actions/fan';
import FanHeader from './components/FanHeader';
import FanBody from './components/FanBody';
import FanStatusBar from './components/FanStatusBar';
import Loading from '../../../components/Common/Loading';
import Chat from '../../../components/Common/Chat';
import NetworkReconnect from '../../Common/NetworkReconnect';
import { disconnect } from '../../../services/opentok';
import './Fan.css';

/* beautify preserve:start */
type InitialProps = { params: { fanUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celeb',
  userUrl: string,
  event: null | BroadcastEvent,
  inPrivateCall: boolean,
  status: EventStatus,
  broadcast: BroadcastState,
  backstageConnected: boolean,
  participants: BroadcastParticipants,
  fanStatus: FanStatus,
  producerChat: ChatState,
  ableToJoin: boolean,
  disconnected: boolean,
  postProduction: boolean
};
type DispatchProps = {
  init: FanInitOptions => void,
  changeEventStatus: EventStatus => void,
  joinLine: Unit,
  leaveLine: Unit
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Fan extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;

  componentDidMount() {
    const { adminId, userType, userUrl, init } = this.props;
    const options = {
      adminId,
      userType,
      userUrl,
    };
    init(options);
  }

  componentWillReceiveProps(nextProps: Props) {
    // Need to check for change to event status here
    if (R.pathEq(['event', 'status'], 'closed', nextProps)) { disconnect(); }
  }

  render(): ReactComponent {
    const { // $FlowFixMe
      event,
      status,
      participants,
      inPrivateCall,
      joinLine,
      leaveLine,
      backstageConnected,
      fanStatus,
      producerChat,
      ableToJoin,
      disconnected,
      postProduction,
    } = this.props;
    if (!event) return <Loading />;
    const participantIsConnected = (type: ParticipantType): boolean => R.path([type, 'connected'], participants || {});
    const hasStreams = R.any(participantIsConnected)(['host', 'celebrity', 'fan']);
    const isClosed = R.equals(status, 'closed');
    const isLive = R.equals(status, 'live');
    return (
      <div className="Fan">
        <NetworkReconnect />
        <div className="Container">
          <FanHeader
            name={event.name}
            status={status}
            ableToJoin={ableToJoin}
            getInLine={joinLine}
            postProduction={postProduction}
            leaveLine={leaveLine}
            backstageConnected={backstageConnected}
            inPrivateCall={inPrivateCall}
            disconnected={disconnected}
          />
          <FanStatusBar fanStatus={fanStatus} />
          <FanBody
            hasStreams={hasStreams}
            image={isClosed ? event.endImage : event.startImage}
            participants={participants}
            isClosed={isClosed}
            isLive={isLive}
            fanStatus={fanStatus}
            backstageConnected={backstageConnected}
            ableToJoin={ableToJoin}
            hlsUrl={event.hlsUrl}
            postProduction={postProduction}
          />
          <div className="FanChat" >
            { producerChat && <Chat chat={producerChat} /> }
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { fanUrl } = ownProps.params;
  return {
    adminId: R.path(['params', 'adminId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    postProduction: R.path(['fan', 'postProduction'], state),
    userUrl: fanUrl,
    inPrivateCall: R.path(['fan', 'inPrivateCall'], state),
    event: R.path(['broadcast', 'event'], state),
    status: R.path(['broadcast', 'event', 'status'], state),
    broadcast: R.path(['broadcast'], state),
    participants: R.path(['broadcast', 'participants'], state),
    ableToJoin: R.path(['fan', 'ableToJoin'], state),
    fanStatus: R.path(['fan', 'status'], state),
    backstageConnected: R.path(['broadcast', 'backstageConnected'], state),
    producerChat: R.path(['broadcast', 'chats', 'producer'], state),
    disconnected: R.path(['broadcast', 'disconnected'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: FanInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  joinLine: (): void => dispatch(getInLine()),
  leaveLine: (): void => dispatch(leaveTheLine()),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Fan));
