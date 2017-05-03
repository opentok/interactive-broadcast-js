// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo, resetAlert } from './alert';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import { disconnect, unsubscribeAll, subscribeAll, signal } from '../services/opentok';
import opentok2 from '../services/opentok2';
import { opentokConfig, setPublishOnly, setBroadcastEventStatus, setBroadcastState, connectToPresence, connectToInteractive } from './broadcast';

const notStarted = R.propEq('status', 'notStarted');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };

const changeStatus: ThunkActionCreator = (eventId: EventId, newStatus: EventStatus): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const actions = [
        updateStatus(eventId, newStatus),
        setBroadcastEventStatus(newStatus),
      ];
      R.forEach(dispatch, actions);
      const type = newStatus === 'live' ? 'goLive' : 'finishEvent';
      opentok2.signal('stage', { type });
    } catch (error) {
      console.log('error on change status ==>', error);
    }
  };

const onSignal = (dispatch: Dispatch) => ({ type, data, from }: Signal) => {
  const signalData = data ? JSON.parse(data) : {};
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';
  switch (type) {
    case 'signal:changeVolume':
      fromProducer && opentok2.changeVolume('stage', signalData.userType, signalData.volume);
      break;
    default:
      break;
  }
};

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { adminId, userType });
      const eventData: HostCelebEventData = await getEventWithCredentials(data, getState().auth.authToken);
      dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
    } catch (error) {
      console.log(error);
    }
  };

const toggleParticipantProperty: ThunkActionCreator = (user: ParticipantType, prop: ParticipantAVProperty): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participants = R.path(['broadcast', 'participants'], getState());
    const to = participants[user].stream.connection;
    const newValue = !participants[user][prop];
    const stage = user !== 'backstageFan';
    participants[user][prop] = newValue;
    let signalObj;
    switch (prop) {
      case 'audio':
        signalObj = { type: 'muteAudio', to, data: { mute: newValue ? 'off' : 'on' } };
        break;
      case 'video':
        signalObj = { type: 'videoOnOff', to, data: { video: newValue ? 'on' : 'off' } };
        break;
      case 'volume':
        signalObj = { type: 'changeVolume', data: { userType: user, volume: newValue ? 100 : 50 } };
        break;
      default: // Do Nothing
    }
    signalObj && signal(signalObj, stage);
    dispatch({ type: 'SET_BROADCAST_PARTICIPANTS', participants });
  };

const connectBroadcast: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
    const credentials = R.pick(credentialProps, await getAdminCredentials(eventId));
    await dispatch(connectToInteractive(credentials, 'producer', onSignal(dispatch)));
    dispatch(connectToPresence());
    dispatch({ type: 'BROADCAST_CONNECTED', connected: true });
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    disconnect();
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
  };

const initializeBroadcast: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const event = R.path(['events', 'map', eventId], getState()) || await getEvent(eventId);
      const actions = [
        updateStatus(eventId, 'preshow'),
        connectBroadcast(eventId),
        { type: 'SET_BROADCAST_EVENT', event: R.evolve(setStatus, event) },
      ];
      R.forEach(dispatch, notStarted(event) ? actions : R.tail(actions));
    } catch (error) {
      browserHistory.replace('/admin');
      dispatch(setInfo({ title: 'Event Not Found', text: `Could not find event with the ID ${eventId}` }));
    }
  };

const startCountdown: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const options = (counter: number): AlertPartialOptions => ({
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
    const actions = [
      setBroadcastState(newBroadcastState),
      setPublishOnly(enabled),
    ];
    R.forEach(dispatch, actions);
  };

module.exports = {
  initializeBroadcast,
  resetBroadcastEvent,
  startCountdown,
  publishOnly,
  toggleParticipantProperty,
  changeStatus,
  setBroadcastEventWithCredentials,
  setBroadcastEventStatus,
};
