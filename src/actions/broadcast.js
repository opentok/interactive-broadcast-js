// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo, resetAlert } from './alert';
import { validateUser } from './auth';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import { connect, disconnect, unsubscribeAll, subscribeAll, signal } from '../services/opentok';
import io from '../services/socket-io';

const notStarted = R.propEq('status', 'notStarted');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };

const setBroadcastEventStatus: ActionCreator = (status: string): BroadcastAction => ({
  type: 'SET_BROADCAST_EVENT_STATUS',
  status,
});

const setBroadcastState: ActionCreator = (state: BroadcastState): BroadcastAction => ({
  type: 'SET_BROADCAST_STATE',
  state,
});

const setPublishOnly: ActionCreator = (publishOnlyEnabled: boolean): BroadcastAction => ({
  type: 'SET_PUBLISH_ONLY_ENABLED',
  publishOnlyEnabled,
});

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = { adminId, userType };
      data[`${userType}Url`] = slug;
      const eventData = await getEventWithCredentials(data, getState().auth.authToken);
      dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
    } catch (error) {
      console.log(error);
    }
  };

const toggleParticipantProperty: ThunkActionCreator = (user: userType, prop: Prop): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participants = R.path(['broadcast', 'participants'], getState());
    const to = participants[user].stream.connection;
    const newValue = !participants[user][prop];
    const stage = user !== 'backstageFan';
    participants[user][prop] = newValue;
    let signalObj;
    switch (prop) {
      case 'audio':
        signalObj = { type: 'muteAudio', to, signalData: { mute: newValue ? 'off' : 'on' } };
        break;
      case 'video':
        signalObj = { type: 'videoOnOff', to, signalData: { video: newValue ? 'on' : 'off' } };
        break;
      case 'volume':
        signalObj = { type: 'changeVolume', signalData: { userType: user, volume: newValue ? 100 : 50 } };
        break;
      default: // Do Nothing
    }
    signalObj && signal(signalObj, stage);
    dispatch({ type: 'SET_BROADCAST_PARTICIPANTS', participants });
  };

const setParticipants: ThunkActionCreator = (user: userType, otEvent: string, stream: Stream): Thunk =>
  (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participants = R.path(['broadcast', 'participants'], getState());
    const connected = otEvent === 'streamCreated';
    participants[user].connected = connected;
    participants[user].stream = connected ? stream : null;
    if (!connected) {
      participants[user].audio = false;
      participants[user].video = false;
      participants[user].volume = 100;
    } else {
      participants[user].audio = stream.hasAudio;
      participants[user].video = stream.hasVideo;
    }
    dispatch({ type: 'SET_BROADCAST_PARTICIPANTS', participants });
  };

const connectToPresence: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const onConnect = () => {
      dispatch({ type: 'BROADCAST_PRESENCE_CONNECTED', connected: true });
    };
    io.connected ? onConnect() : io.on('connect', onConnect);
  };

const connectToInteractive: ThunkActionCreator = (credentials: UserCredentials, userType: UserType, onSignal: Listener): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const listeners = {
      onStateChanged: (state: object): void => dispatch(setBroadcastState(state)),
      onStreamChanged: (user: string, otEvent: string, stream: Stream): void => dispatch(setParticipants(user, otEvent, stream)),
      onSignal,
    };
    await connect(credentials, userType, listeners);
  };

const connectToPresenceWithToken: ThunkActionCreator = (adminId: string, fanUrl: string, onSignal: Listener): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {

    // get the Auth Token
    const { auth } = getState();

    const onAuthenticated = () => {
      io.emit('joinInteractive', { fanUrl, adminId });
      io.on('ableToJoin', ({ ableToJoin, broadcastData, eventData }: BroadcastData) => {
        if (ableToJoin) {
          dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
          dispatch(connectToInteractive(eventData, 'fan', onSignal));
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

const connectBroadcast: ThunkActionCreator = (eventId: EventId, onSignal: Listener): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const credentials = await getAdminCredentials(eventId);
    await dispatch(connectToInteractive(credentials, 'producer', onSignal));
    dispatch(connectToPresence());
    dispatch({ type: 'BROADCAST_CONNECTED', connected: true });
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    disconnect();
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
  };

const initCelebHost: ThunkActionCreator = ({ adminId, userType, userUrl, onSignal }: initOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get an Auth Token
      await dispatch(validateUser(adminId, userType, userUrl));
      // Get the event data + OT credentials
      await dispatch(setBroadcastEventWithCredentials(adminId, userType, userUrl));

      // Connect to the session
      const eventData = R.path(['broadcast', 'event'], getState());
      const { apiKey, stageToken, stageSessionId, status } = eventData;
      const credentials = {
        apiKey,
        stageSessionId,
        stageToken,
      };
      status !== 'closed' && await dispatch(connectToInteractive(credentials, userType, onSignal));
    } catch (error) {
      console.log('error', error);
    }
  };

const initFan: ThunkActionCreator = ({ adminId, userType, userUrl, onSignal }: initOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get an Auth Token
      await dispatch(validateUser(adminId, userType, userUrl));
      // Connect to socket.io and OT sessions if the fan is able to join
      await dispatch(connectToPresenceWithToken(adminId, userUrl, onSignal));

    } catch (error) {
      console.log('error', error);
    }
  };

const setBroadcastEvent: ThunkActionCreator = (eventId: EventId, onSignal: Listener): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const event = R.path(['events', 'map', eventId], getState()) || await getEvent(eventId);
      const actions = [
        updateStatus(eventId, 'preshow'),
        connectBroadcast(eventId, onSignal),
        { type: 'SET_BROADCAST_EVENT', event: R.evolve(setStatus, event) },
      ];
      R.forEach(dispatch, notStarted(event) ? actions : R.tail(actions));
    } catch (error) {
      browserHistory.replace('/admin');
      dispatch(setInfo({ title: 'Event Not Found', text: `Could not find event with the ID ${eventId}` }));
    }
  };

const changeStatus: ThunkActionCreator = (eventId: EventId, newStatus: EventStatus): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const actions = [
        updateStatus(eventId, newStatus),
        setBroadcastEventStatus(newStatus),
      ];
      R.forEach(dispatch, actions);
      const type = newStatus === 'live' ? 'goLive' : 'finishEvent';
      signal({ type }, true);
    } catch (error) {
      console.log('error on change status ==>', error);
    }
  };

const startCountdown: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const options = (counter: string): AlertPartialOptions => ({
      title: 'GOING LIVE IN',
      text: `<h1>${counter}</h1>`,
      showConfirmButton: false,
      html: true,
    });
    let counter = 5;
    const interval = setInterval(() => {
      dispatch(setInfo(options(counter || 1)));
      if (counter >= 1) {
        counter -= 1;
      } else {
        clearInterval(interval);
        dispatch(resetAlert());
      }
    }, 1000);
  };

const publishOnly: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const enabled = !R.path(['broadcast', 'publishOnlyEnabled'], state);
    const newBroadcastState = enabled ? unsubscribeAll(true) : subscribeAll(true);
    console.log('newBroadcastState', newBroadcastState);
    const actions = [
      setBroadcastState(newBroadcastState),
      setPublishOnly(enabled),
    ];
    R.forEach(dispatch, actions);
  };

module.exports = {
  setBroadcastEvent,
  resetBroadcastEvent,
  initCelebHost,
  startCountdown,
  publishOnly,
  toggleParticipantProperty,
  changeStatus,
  initFan,
  setBroadcastEventWithCredentials,
};
