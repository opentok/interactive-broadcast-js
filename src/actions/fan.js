// @flow
import R from 'ramda';
import platform from 'platform';
import { validateUser } from './auth';
import { connectToInteractive, setBroadcastEventStatus, setBackstageConnected } from './broadcast';
import { setInfo, resetAlert } from './alert';
import opentok from '../services/opentok';
import { createSnapshot } from '../services/snapshot';
import io from '../services/socket-io';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;

const setNewFanSignalAckd: ActionCreator = (newFanSignalAckd: boolean): FanAction => ({
  type: 'SET_NEW_FAN_ACKD',
  newFanSignalAckd,
});

const setFanName: ActionCreator = (fanName: string): FanAction => ({
  type: 'SET_FAN_NAME',
  fanName,
});

const setAbleToJoin: ActionCreator = (ableToJoin: boolean): FanAction => ({
  type: 'SET_ABLE_TO_JOIN',
  ableToJoin,
});

const onSignal = (dispatch: Dispatch, getState: GetState): SignalListener => ({ type, data, from }: Signal) => {
  const state = getState();
  const signalData = data ? JSON.parse(data) : {};
  const signalType = R.last(R.split(':', type));
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';

  /* If the sender of this signal is not the Producer, we should do nothing */
  if (!fromProducer) return;

  switch (signalType) {
    case 'goLive':
      dispatch(setBroadcastEventStatus('live'));
      opentok.subscribeAll('stage');
      break;
    case 'videoOnOff':
      toggleLocalVideo(signalData.video === 'on');
      break;
    case 'muteAudio':
      toggleLocalAudio(signalData.mute === 'off');
      break;
    case 'changeVolume':
      changeVolume('stage', signalData.userType, signalData.volume);
      break;
    case 'chatMessage': // @TODO
    case 'privateCall': // @TODO
    case 'endPrivateCall': // @TODO
    case 'openChat': // @TODO
    case 'resendNewFanSignal': {
      const newFanSignalAckd = R.path(['fan', 'newFanSignalAckd'], state);
      if (newFanSignalAckd) return;

      const userInfo = {
        username: R.path(['fan', 'fanName'], state),
        quality: 'great', // @TODO: send the actual quality
        user_id: R.path(['broadcast', 'event', 'backstageToken'], state),
        browser: platform.name,
        os: platform.os.family,
        mobile: platform.manufacturer !== null,
      };
      opentok.signal('backstage', { type: 'newFan', data: userInfo });
      break;
    }
    case 'newFanAck': {
      /* We received newFanAck signal so let's set save the state in storage */
      dispatch(setNewFanSignalAckd(true));
      /* Get the connection Id from the publisher */
      const publisher = opentok.getPublisher('backstage');
      const connectionId = publisher.stream.connection.connectionId;
      /* Reuse the publisher to get the sessionId */
      const sessionId = publisher.session.id;
      /* Create the snapshot and send it to the producer via socket.io */
      createSnapshot(publisher.getImgData(), (snapshot: string) => {
        io.emit('mySnapshot', {
          connectionId,
          snapshot,
          sessionId,
        });
      });
      break;
    }
    case 'finishEvent':
      dispatch(setBroadcastEventStatus('closed'));
      break;
    case 'startEvent':
      dispatch(setNewFanSignalAckd(false));
      break;
    default:
      break;
  }
};

const onStreamChanged: ThunkActionCreator = (user: UserRole, event: StreamEventType, stream: Stream): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const status = R.path(['broadcast', 'event', 'status'], getState());
    const userHasJoined = R.equals(event, 'streamCreated');
    if (R.equals(status, 'live') && userHasJoined) {
      opentok.subscribe('stage', stream);
    }
  };


const connectToPresenceWithToken: ThunkActionCreator = (adminId: string, fanUrl: string): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {

    // get the Auth Token
    const { auth } = getState();

    const onAuthenticated = () => {
      io.emit('joinInteractive', { fanUrl, adminId });
      io.on('ableToJoin', ({ ableToJoin, eventData }: { ableToJoin: boolean, eventData: BroadcastEvent & UserCredentials}) => {
        if (ableToJoin) {
          dispatch(setAbleToJoin);
          dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
          const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
          const credentials = R.pick(credentialProps, eventData);
          dispatch(connectToInteractive(credentials, 'fan', { onSignal: onSignal(dispatch, getState), onStreamChanged }, eventData));
        } else {
          // @TODO: Should display the HLS version or a message.
        }
      });
    };

    const onUnauthorized = (msg: string): void => console.log('unauthorized', msg);

    const onConnect = () => {
      dispatch({ type: 'BROADCAST_PRESENCE_CONNECTED', connected: true });
      io
        .emit('authenticate', { token: auth.authToken })
        .on('authenticated', onAuthenticated)
        .on('unauthorized', onUnauthorized);
    };

    // Connect to the signaling server
    io.connected ? onConnect() : io.on('connect', onConnect);
  };

const initializeBroadcast: ThunkActionCreator = ({ adminId, userUrl }: FanInitOptions): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      // Get an Auth Token
      await dispatch(validateUser(adminId, 'fan', userUrl));
      // Connect to socket.io and OT sessions if the fan is able to join
      await dispatch(connectToPresenceWithToken(adminId, userUrl));

    } catch (error) {
      console.log('error', error);
    }
  };

const connectToBackstage: ThunkActionCreator = (fanName: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Close the prompt */
    dispatch(resetAlert());
    /* Save the fan name in the storage */
    dispatch(setFanName(fanName || 'Anonymous'));
    /* Connect to backstage session */
    await opentok.connect(['backstage']);
    /* Save the new backstage connection state */
    dispatch(setBackstageConnected(true));
    /* Get the sessionId and join the room in socket.io */
    const sessionId = R.path(['broadcast', 'event', 'sessionId'], getState());
    io.emit('joinRoom', sessionId);
  };

const getInTheLine: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const fanName = R.path(['fan', 'fanName'], getState());
    const options = (): AlertPartialOptions => ({
      title: 'Almost done!',
      text: 'You may enter you name below.',
      type: 'input',
      closeOnConfirm: false,
      inputPlaceholder: 'Name (Optional)',
      allowEscapeKey: false,
      html: true,
      confirmButtonColor: '#00a3e3',
      onConfirm: (inputValue: string): void => dispatch(connectToBackstage(inputValue)),
    });
    dispatch(fanName ? connectToBackstage(fanName) : setInfo(options()));
  };

const leaveTheLine: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    await opentok.disconnectFromInstance('backstage');
    dispatch(setBackstageConnected(false));
  };

module.exports = {
  initializeBroadcast,
  getInTheLine,
  leaveTheLine,
};
