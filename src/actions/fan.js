// @flow
import R from 'ramda';
import { validateUser } from './auth';
import { connectToInteractive, setBroadcastEventStatus } from './broadcast';
import opentok from '../services/opentok';
import io from '../services/socket-io';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;
const onSignal = (dispatch: Dispatch): SignalListener => ({ type, data, from }: Signal) => {
  const signalData = data ? JSON.parse(data) : {};
  const signalType = R.last(R.split(':', type));
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';
  switch (signalType) {
    case 'goLive':
      dispatch(setBroadcastEventStatus('live'));
      break;
    case 'videoOnOff':
      fromProducer && toggleLocalVideo(signalData.video === 'on');
      break;
    case 'muteAudio':
      fromProducer && toggleLocalAudio(signalData.mute === 'off');
      break;
    case 'changeVolume':
      fromProducer && changeVolume('stage', signalData.userType, signalData.volume);
      break;
    case 'chatMessage': // @TODO
    case 'privateCall': // @TODO
    case 'endPrivateCall': // @TODO
    case 'openChat': // @TODO
    case 'finishEvent':
      fromProducer && setBroadcastEventStatus('closed');
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
      opentok.subscribe(stream, 'stage');
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
          dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
          const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
          const credentials = R.pick(credentialProps, eventData);
          dispatch(connectToInteractive(credentials, 'fan', { onSignal: onSignal(dispatch), onStreamChanged }, eventData));
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


module.exports = {
  initializeBroadcast,
};
