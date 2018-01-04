// @flow
import R from 'ramda';
import moment from 'moment';
import { setInfo, resetAlert } from './alert';
import opentok from '../services/opentok';
import firebase from '../services/firebase';
import { isUserOnStage } from '../services/util';

// Presence heartbeat time in seconds.
const heartBeatTime = 10;

const avPropertyChanged: ActionCreator = (participantType: UserRole, update: ParticipantAVPropertyUpdate): BroadcastAction => ({ 
  type: 'PARTICIPANT_AV_PROPERTY_CHANGED',
  participantType,
  update,
});

const startFanTransition: ActionCreator = (): BroadcastAction => ({
  type: 'FAN_TRANSITION',
  fanTransition: true,
});

const stopFanTransition: ActionCreator = (): BroadcastAction => ({
  type: 'FAN_TRANSITION',
  fanTransition: false,
});

const setReconnecting: ActionCreator = (): BroadcastAction => ({
  type: 'SET_RECONNECTING',
  reconnecting: true,
});

const setReconnected: ActionCreator = (): BroadcastAction => ({
  type: 'SET_RECONNECTING',
  reconnecting: false,
});

const setDisconnected: ActionCreator = (): BroadcastAction => ({
  type: 'SET_DISCONNECTED',
  disconnected: true,
});

const updateStageCountdown: ActionCreator = (stageCountdown: number): BroadcastAction => ({
  type: 'UPDATE_STAGE_COUNTDOWN',
  stageCountdown,
});

const setBackstageConnected: ActionCreator = (connected: boolean): BroadcastAction => ({
  type: 'BACKSTAGE_CONNECTED',
  connected,
});

const setBroadcastEventStatus: ActionCreator = (status: EventStatus): BroadcastAction => ({
  type: 'SET_BROADCAST_EVENT_STATUS',
  status,
});

const setBroadcastState: ActionCreator = (state: CoreState): BroadcastAction => ({
  type: 'SET_BROADCAST_STATE',
  state,
});

const setPublishOnly: ActionCreator = (publishOnlyEnabled: boolean): BroadcastAction => ({
  type: 'SET_PUBLISH_ONLY_ENABLED',
  publishOnlyEnabled,
});

const setBroadcastEvent: ActionCreator = (event: BroadcastEvent): BroadcastAction => ({
  type: 'SET_BROADCAST_EVENT',
  event,
});

const setPrivateCall: ActionCreator = (privateCall: PrivateCallState): BroadcastAction => ({
  type: 'SET_PRIVATE_CALL_STATE',
  privateCall,
});

const endPrivateCall: ThunkActionCreator = (participant: ParticipantType, userInCallDisconnected?: boolean = false): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    // See TODO above. We have no way of knowing who the current user is unless we pass the value around
    const instance = R.equals(participant, 'backstageFan') ? 'backstage' : 'stage';
    const currentUserInCall = R.equals(participant, R.path(['broadcast', 'privateCall', 'isWith'], getState()));
    if (R.and(currentUserInCall, !userInCallDisconnected)) {
      opentok.subscribeAll('stage', true);
      opentok.unsubscribeFromAudio(instance, opentok.getStreamByUserType(instance, 'producer'));
    }
    dispatch({ type: 'SET_PRIVATE_CALL_STATE', privateCall: null });
  };

/**
 * Toggle a participants audio, video, or volume
 */
const toggleParticipantProperty: ThunkActionCreator = (participantType: ParticipantType, property: ParticipantAVProperty): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participant = R.path(['broadcast', 'participants', participantType], getState());
    const { adminId, fanUrl } = R.path(['event'], getState().broadcast);
    const currentValue = R.prop(property, participant);

    const update: ParticipantAVPropertyUpdate = R.ifElse(
      R.equals('volume'), // $FlowFixMe
      (): { property: 'volume', value: number } => ({ property, value: currentValue === 100 ? 25 : 100 }), // $FlowFixMe
      (): { property: 'audio' | 'video', value: boolean } => ({ property, value: !currentValue }) // eslint-disable-line comma-dangle
    )(property);
    const { value } = update;

    const to = R.path(['stream', 'connection'], participant);
    const instance = R.equals('backstageFan', participantType) ? 'backstage' : 'stage'; // For moving to OT2

    // TODO: Simplify signals
    // 1.) Make data values booleans that match the actual values
    // 2.) Create types for each action type (e.g. enableAudio, disableAudio, etc)
    switch (property) {
      case 'audio':
        opentok.signal(instance, { type: 'muteAudio', to, data: { mute: value ? 'off' : 'on' } });
        dispatch(avPropertyChanged(participantType, update));
        break;
      case 'video':
        opentok.signal(instance, { type: 'videoOnOff', to, data: { video: value ? 'on' : 'off' } });
        dispatch(avPropertyChanged(participantType, update));
        break;
      case 'volume':
        try {
          const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/volume/${participantType}`);
          ref.set(value);
        } catch (error) {
          console.log(error);
        }
        break;
      default: // Do Nothing
    }
  };

/**
 * Kick fan from stage or backstage feeds
 */
const forceFanToDisconnect: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(stopFanTransition());
    const stream = opentok.getStreamById('backstage', fan.streamId);
    opentok.forceDisconnect('backstage', stream.connection);
  };

/**
 * Update the participants state when someone joins or leaves
 */
const updateParticipants: ThunkActionCreator = (participantType: ParticipantType, event: ParticipantEventType, stream: Stream): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    switch (event) {
      case 'backstageFanLeft': {
        const participant = R.path(['broadcast', 'participants', 'backstageFan'], getState());
        if (!!participant.stream && R.equals(participant.stream.streamId, stream.streamId)) {
          dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
        }
        break;
      }
      case 'streamCreated':
        dispatch({ type: 'BROADCAST_PARTICIPANT_JOINED', participantType, stream });
        break;
      case 'streamDestroyed':
        {
          const inPrivateCall = R.equals(participantType, R.path(['broadcast', 'privateCall', 'isWith'], getState()));
          inPrivateCall && dispatch(endPrivateCall(participantType, true));
          dispatch({ type: 'REMOVE_CHAT', chatId: participantType });
          dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
          break;
        }
      case 'startCall':
        dispatch({ type: 'BROADCAST_PARTICIPANT_JOINED', participantType, stream });
        break;
      default:
        break;
    }
  };

/**
 * Update the participants state when someone joins or leaves
 */
const monitorVolume: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const event = R.prop('event', getState().broadcast);
    const { adminId, fanUrl } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/volume`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const volumeMap = snapshot.val();
      const participants = R.prop('participants', getState().broadcast);
      R.forEachObjIndexed((value: number, participantType: UserRole) => {
        if (participants[participantType].volume !== value) {
          const instance = isUserOnStage(participantType) ? 'stage' : 'backstage';
          opentok.changeVolume(instance, participantType, value);
          const update = { property: 'volume', value };
          dispatch(avPropertyChanged(participantType, update));
        }
      }, volumeMap);
    });
  };

/**
 * Heartbeat that keeps track of the user presence
 */
const startHeartBeat: ThunkActionCreator = (userType: UserType): Thunk =>
(dispatch: Dispatch, getState: GetState) => {
  const event = R.prop('event', getState().broadcast);
  const { adminId, fanUrl } = event;
  const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/${userType}HeartBeat`);
  const updateHeartbeat = (): void => ref.set(moment.utc().valueOf());
  updateHeartbeat();
  setInterval(() => {
    updateHeartbeat();
  }, heartBeatTime * 1000);
};

/**
 * Start the go live countdown
 */
const startCountdown: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch): AsyncVoid => new Promise(resolve => {
    const options = (counter?: number = 1): AlertPartialOptions => ({
      title: 'GOING LIVE IN',
      text: `<h1>${counter}</h1>`,
      showConfirmButton: false,
      html: true,
      allowEscapeKey: false,
    });
    let counter = 5;
    const interval = setInterval(() => {
      dispatch(setInfo(options(counter)));
      if (counter >= 1) {
        counter -= 1;
      } else {
        clearInterval(interval);
        dispatch(resetAlert());
        resolve();
      }
    }, 1000);
  });

const publishOnly: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const enabled = !R.path(['broadcast', 'publishOnlyEnabled'], getState());
    const newBroadcastState = enabled ? opentok.unsubscribeAll('stage', false, true) : opentok.subscribeAll('stage', false, true);
    const actions = [
      setBroadcastState(newBroadcastState),
      setPublishOnly(enabled),
    ];
    R.forEach(dispatch, actions);
  };

const sendChatMessage: ThunkActionCreator = (chatId: ChatId, message: ChatMessagePartial): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const chat: ChatState = R.path(['broadcast', 'chats', chatId], getState());
    const to = chatId === 'producer' ? opentok.getConnectionByUserType(chat.session, 'producer') : chat.to.connection;
    try {
      to && await opentok.signal(chat.session, { type: 'chatMessage', to, data: message });
    } catch (error) {
      // @TODO Error handling
      console.log('Failed to send chat message', error);
    }
    dispatch({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', true, message) });
  };

let timer;
const startElapsedTimeInterval: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const showStartedAt = R.path(['broadcast', 'event', 'showStartedAt'], getState());
    /* Convert the timeStamp to YYYY-MM-DD HH:mm:ss format */
    const to = moment(moment.utc(showStartedAt).toDate()).format('YYYY-MM-DD HH:mm:ss');
    /* Get the current datetime */
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    /* Get the difference between both dates and update the store */
    const elapsedTime = moment.utc(moment(now).diff(to)).format('HH:mm:ss');
    dispatch({ type: 'SET_ELAPSED_TIME', elapsedTime });
  };

const startElapsedTime: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    timer = setInterval((): void => dispatch(startElapsedTimeInterval()), 1000);
  };

const stopElapsedTime: ThunkActionCreator = (): Thunk => (): void => clearInterval(timer);

const setBroadcastEventShowStarted: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const showStartedAt = moment.utc().format();
    dispatch({ type: 'SET_BROADCAST_EVENT_SHOW_STARTED', showStartedAt });
    dispatch(startElapsedTime());
  };

const minimizeChat: ActionCreator = (chatId: ChatId, minimize?: boolean = true): BroadcastAction => ({
  type: 'MINIMIZE_CHAT',
  chatId,
  minimize,
});

const displayChat: ActionCreator = (chatId: ChatId, display?: boolean = true): BroadcastAction => ({
  type: 'DISPLAY_CHAT',
  chatId,
  display,
});

const onChatMessage: ThunkActionCreator = (chatId: ChatId): Thunk =>
  (dispatch: Dispatch) => {
    R.forEach(dispatch, [minimizeChat(chatId, false), displayChat(chatId, true)]);
  };

module.exports = {
  setBroadcastState,
  setBroadcastEvent,
  setReconnecting,
  setReconnected,
  setDisconnected,
  setPrivateCall,
  setPublishOnly,
  startCountdown,
  endPrivateCall,
  publishOnly,
  toggleParticipantProperty,
  setBroadcastEventStatus,
  updateParticipants,
  setBackstageConnected,
  sendChatMessage,
  minimizeChat,
  monitorVolume,
  displayChat,
  onChatMessage,
  updateStageCountdown,
  setBroadcastEventShowStarted,
  stopElapsedTime,
  startElapsedTime,
  forceFanToDisconnect,
  startFanTransition,
  stopFanTransition,
  startHeartBeat,
  heartBeatTime,
};

