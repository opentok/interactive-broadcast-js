// @flow
import R from 'ramda';
import platform from 'platform';
import { validateUser } from './auth';
import firebase from '../services/firebase';
import { connectToInteractive, setBroadcastEventStatus, setBackstageConnected } from './broadcast';
import { setInfo, resetAlert } from './alert';
import opentok from '../services/opentok';
import snapshot from '../services/snapshot';
import io from '../services/socket-io';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;

const setFanStatus: ActionCreator = (status: FanStatus): FanAction => ({
  type: 'SET_FAN_STATUS',
  status,
});

const setFanName: ActionCreator = (fanName: string): FanAction => ({
  type: 'SET_FAN_NAME',
  fanName,
});

const setAbleToJoin: ActionCreator = (ableToJoin: boolean): FanAction => ({
  type: 'SET_ABLE_TO_JOIN',
  ableToJoin,
});

const createSnapshot = async (publisher: Publisher): ImgData => {
  try {
    const fanSnapshot = await snapshot(publisher.getImgData()); // $FlowFixMe @TODO: resolve flow error
    return fanSnapshot;
  } catch (error) {
    console.log('Failed to create fan snapshot'); // $FlowFixMe @TODO: resolve flow error
    return null;
  }
};

const updateActiveFanRecord: ThunkActionCreator = (fanUpdate: ActiveFanUpdate, event: BroadcastEvent): Thunk =>
  async (): AsyncVoid => {
    const fanId = firebase.auth().currentUser.uid;
    const { id, adminId } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${id}/activeFans/${fanId}`);
    try {
      R.isNil(fanUpdate) ? ref.remove() : ref.update(fanUpdate);
    } catch (error) {
      console.log('Failed to update active fan record: ', error);
    }
  };

const receivedChatMessage: ThunkActionCreator = (connection: Connection, message: ChatMessage): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = 'producer';
    const state = getState();
    const existingChat = R.pathOr(null, ['broadcast', 'chats', chatId], state);
    const fanType = (): ChatUser => {
      const status: FanStatus = R.path(['fan', 'fanStatus'], state);
      switch (status) {
        case 'inLine':
          return 'activeFan';
        case 'backstage':
          return 'backstageFan';
        case 'stage':
          return 'fan';
        default:
          return 'activeFan';
      }
    };
    const fromId = firebase.auth().currentUser.uid;
    const actions = [
      ({ type: 'START_NEW_PRODUCER_CHAT', fromType: fanType(), fromId, producer: { connection } }),
      ({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, message) }),
    ];
    R.forEach(dispatch, existingChat ? R.tail(actions) : actions);
  };


const onSignal = (dispatch: Dispatch, getState: GetState): SignalListener =>
  async ({ type, data, from }: Signal): AsyncVoid => {
    const state = getState();
    const signalData = data ? JSON.parse(data) : {};
    const signalType = R.last(R.split(':', type));
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';
    const isStage = R.equals(R.path(['fan', 'status'], state), 'stage');
    const instance = isStage ? 'stage' : 'backstage';
    /* If the sender of this signal is not the Producer, we should do nothing */
    if (!fromProducer) return;

    switch (signalType) {
      case 'goLive':
        dispatch(setBroadcastEventStatus('live'));
        opentok.subscribeAll('stage');
        break;
      case 'videoOnOff':
        toggleLocalVideo(instance, signalData.video === 'on');
        break;
      case 'muteAudio':
        toggleLocalAudio(instance, signalData.mute === 'off');
        break;
      case 'changeVolume':
        changeVolume('stage', signalData.userType, signalData.volume);
        break;
      case 'chatMessage':
        dispatch(receivedChatMessage(from, signalData));
      case 'privateCall': // @TODO
      case 'endPrivateCall': // @TODO
      case 'openChat': // @TODO
      case 'finishEvent':
        dispatch(setBroadcastEventStatus('closed'));
        break;
      case 'joinBackstage':
        dispatch(setFanStatus('backstage'));
        break;
      case 'disconnectBackstage':
        dispatch(setFanStatus('inLine'));
        break;
      case 'joinHost':
        {
          /* Unpublish from backstage */
          await opentok.endCall('backstage');
          /* Display the going live alert */
          const options = (): AlertPartialOptions => ({
            title: '<h5>GOING LIVE NOW</h5>',
            text: '<h1><i class="fa fa-spinner fa-pulse"></i></h1>',
            showConfirmButton: false,
            html: true,
            type: null,
            allowEscapeKey: false,
          });
          dispatch(setInfo(options()));
          break;
        }
      case 'joinHostNow':
        {
          /* Change the status of the fan to 'stage' */
          dispatch(setFanStatus('stage'));
          /* Close the alert */
          dispatch(resetAlert());
          /* Start publishing to onstage */
          opentok.startCall('stage');
          /* Start subscribing from onstage */
          opentok.subscribeAll('stage');
          break;
        }
      default:
        break;
    }
  };

const createActiveFanRecord: ThunkActionCreator = (uid: UserId, name: string, event: BroadcastEvent): Thunk =>
  async (): AsyncVoid => {
    const { id, adminId } = event;
    /* Create the snapshot and send it to the producer via socket.io */
    const publisher = opentok.getPublisher('backstage');
    const record = {
      name,
      id: uid,
      browser: platform.name,
      os: platform.os.family,
      mobile: platform.manufacturer !== null,
      snapshot: await createSnapshot(publisher),
      streamId: publisher.stream.streamId,
    };
    const fanRef = firebase.database().ref(`activeBroadcasts/${adminId}/${id}/activeFans/${uid}`);
    try {
      // Automatically remove the active fan record on disconnect event
      fanRef.onDisconnect().remove((error: Error): void => error && console.log(error));
      fanRef.set(record);
    } catch (error) {
      console.log(error);
    }
  };

const onStreamChanged: ThunkActionCreator = (user: UserRole, event: StreamEventType, stream: Stream): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const isLive = R.equals('live', R.path(['broadcast', 'event', 'status'], state));
    const fanOnStage = R.equals('stage', R.path(['fan', 'status'], state));
    const userHasJoined = R.equals(event, 'streamCreated');
    R.and(R.or(isLive, fanOnStage), userHasJoined) && opentok.subscribe('stage', stream);
  };

const joinActiveFans: ThunkActionCreator = (fanName: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const event = R.path(['broadcast', 'event'], getState());
    try {
      const { uid } = await firebase.auth().signInAnonymously();
      // We have the anonymous uid here
      dispatch(createActiveFanRecord(uid, fanName, event));
    } catch (error) {
      console.log(error);
    }
  };

// const joinActiveFans: ThunkActionCreator = (fanName: string): Thunk =>
//   async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
//     const event = R.path(['broadcast', 'event'], getState());
//     try {
//       const { uid } = await firebase.auth().signInAnonymously();
//       // We have the anonymous uid here
//       dispatch(createActiveFanRecord(uid, fanName, event));
//     } catch (error) {
//       console.log(error);
//     }
//   };


const connectToPresenceWithToken: ThunkActionCreator = (adminId: string, fanUrl: string): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {

    // get the Auth Token
    const { auth } = getState();

    const onAuthenticated = () => {
      io.emit('joinInteractive', { fanUrl, adminId });
      io.on('ableToJoin', ({ ableToJoin, eventData }: { ableToJoin: boolean, eventData: BroadcastEvent & UserCredentials }) => {
        if (ableToJoin) {
          dispatch(setAbleToJoin);
          // dispatch(joinActiveFans(eventData));
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
    /* Save the fan status  */
    dispatch(setFanStatus('inLine'));
    /* Get the sessionId and join the room in socket.io */
    const sessionId = R.path(['broadcast', 'event', 'sessionId'], getState());

    dispatch(joinActiveFans(fanName));
    io.emit('joinRoom', sessionId);
  };

const getInLine: ThunkActionCreator = (): Thunk =>
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
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const event = R.path(['broadcast', 'event'], state);
    const isLive = R.equals('live', event.status);
    const fanOnStage = R.equals('stage', R.path(['fan', 'status'], state));
    await opentok.disconnectFromInstance('backstage');
    if (fanOnStage) await isLive ? opentok.unpublish('stage') : opentok.endCall('stage');
    dispatch(setBackstageConnected(false));
    dispatch(updateActiveFanRecord(null, event, true));
    dispatch(setFanStatus('disconnected'));

  };

module.exports = {
  initializeBroadcast,
  getInLine,
  leaveTheLine,
};
