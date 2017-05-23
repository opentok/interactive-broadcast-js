// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo, resetAlert } from './alert';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import firebase from '../services/firebase';
import opentok from '../services/opentok';
import { connectToPresence, setBroadcastState, updateParticipants, startPrivateCall, endPrivateCall } from './broadcast';

const { disconnect, changeVolume, signal, createEmptyPublisher, publishAudio } = opentok;

const notStarted = R.propEq('status', 'notStarted');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };
const signalStage = R.partial(signal, ['stage']);
// const signalBackstage = R.curry(signal)('backstage');

const onSignal = (dispatch: Dispatch): SignalListener => ({ type, data, from }: Signal) => {
  const signalData = data ? JSON.parse(data) : {};
  const signalType = R.last(R.split(':', type));
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';
  switch (signalType) {
    case 'changeVolume':
      fromProducer && changeVolume('stage', signalData.userType, signalData.volume);
      break;
    case 'chatMessage':
      {
        const { fromType, fromId } = signalData;
        const chatId = R.equals(fromType, 'activeFan') ? `${fromType}-${fromId}` : fromType;
        dispatch({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, signalData) });
      }
      break;
    default:
      break;
  }
};

const opentokConfig = (dispatch: Dispatch, userCredentials: UserCredentials): CoreInstanceOptions[] => {

  // Set common listeners for all user types here
  const eventListeners: CoreInstanceListener = (instance: Core) => {

    // Assign listener for state changes
    const subscribeEvents: SubscribeEventType[] = ['subscribeToCamera', 'unsubscribeFromCamera'];
    const handleSubscribeEvent = (state: CoreState): void => dispatch(setBroadcastState(state));
    R.forEach((event: SubscribeEventType): void => instance.on(event, handleSubscribeEvent), subscribeEvents);

    // Assign listener for stream changes
    const otStreamEvents: StreamEventType[] = ['streamCreated', 'streamDestroyed'];
    const handleStreamEvent: StreamEventHandler = ({ type, stream }: OTStreamEvent) => {
      const isStage = R.propEq('name', 'stage', instance);
      const connectionData: { userType: UserRole } = JSON.parse(stream.connection.data);
      isStage && dispatch(updateParticipants(connectionData.userType, type, stream));
    };

    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);

    // Assign signal listener
    instance.on('signal', onSignal(dispatch));
  };

  const coreOptions = (name: string, credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = true): CoreOptions => ({
    name,
    credentials,
    streamContainers(pubSub: PubSub, source: VideoType, data: { userType: UserRole }): string {
      return `#video${pubSub === 'subscriber' ? data.userType : publisherRole}`;
    },
    communication: {
      autoSubscribe,
      callProperties: {
        fitMode: 'contain',
      },
    },
    controlsContainer: null,
  });

  const stage = (): CoreInstanceOptions => {
    const { apiKey, stageSessionId, stageToken } = userCredentials;
    const credentials = {
      apiKey,
      sessionId: stageSessionId,
      token: stageToken,
    };
    return {
      name: 'stage',
      coreOptions: coreOptions('stage', credentials, 'producer', true),
      eventListeners,
    };
  };

  const backstage = (): CoreInstanceOptions => {
    const { apiKey, sessionId, backstageToken } = userCredentials;
    const credentials = {
      apiKey,
      sessionId,
      token: backstageToken,
    };
    return {
      name: 'backstage',
      coreOptions: coreOptions('backstage', credentials, 'producer', false),
      eventListeners,
    };
  };

  return [stage(), backstage()];
};

/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator = (userCredentials: UserCredentials): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const instances: CoreInstanceOptions[] = opentokConfig(dispatch, userCredentials);
    opentok.init(instances);
    await opentok.connect(['stage', 'backstage']);
    dispatch(setBroadcastState(opentok.state('stage')));
  };

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { adminId, userType });
      const eventData: HostCelebEventData = await getEventWithCredentials(data, R.path(['auth', 'authToken'], getState()));
      dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
    } catch (error) {
      console.log(error);
    }
  };

const updateActiveFans: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const adminId = firebase.auth().currentUser.uid;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${event.id}`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const update = R.prop('activeFans', snapshot.val() || {});
      const currentFans = R.path(['broadcast', 'activeFans', 'map'], getState());
      const fansNoLongerActive: ChatId[] = R.difference(R.keys(currentFans), R.keys(update));
      R.forEach((fanId: ChatId): void => dispatch({ type: 'REMOVE_CHAT', chatId: fanId }), fansNoLongerActive);
      dispatch({ type: 'UPDATE_ACTIVE_FANS', update });
    });
  };

const connectBroadcast: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
    const credentials = R.pick(credentialProps, await getAdminCredentials(event.id));
    await dispatch(connectToInteractive(credentials));
    dispatch(connectToPresence());
    createEmptyPublisher('stage');
    dispatch(updateActiveFans(event));
    dispatch({ type: 'BROADCAST_CONNECTED', connected: true });
    /* Let the fans know that the admin has connected */
    signal('stage', { type: 'startEvent' });
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
        connectBroadcast(event),
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

/**
 * Start a private call with a broadcast participant or active fan
 */
const connectPrivateCall: ThunkActionCreator = (participant: ParticipantType): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const startCall = R.not(R.equals(participant, R.path(['broadcast', 'inPrivateCall'], getState())));
    const type = startCall ? 'privateCall' : 'endPrivateCall';
    const data = { callWith: participant };
    publishAudio('stage', startCall);
    signalStage({ type, data });
    const action = startCall ? startPrivateCall(participant) : endPrivateCall();
    dispatch(action);
  };

const reorderActiveFans: ActionCreator = (update: ActiveFanOrderUpdate): BroadcastAction => ({
  type: 'REORDER_BROADCAST_ACTIVE_FANS',
  update,
});

const chatWithActiveFan: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = `activeFan-${fan.id}`;
    const existingChat = R.path(['broadcast', 'chats', chatId], getState());
    const connection = opentok.getConnection('backstage', fan.streamId);
    if (existingChat) {
      dispatch({ type: 'DISPLAY_CHAT', chatId, display: true });
    } else {
      dispatch({ type: 'START_NEW_FAN_CHAT', fan: R.assoc('connection', connection, fan) });
    }
  };

const chatWithParticipant: ThunkActionCreator = (participantType: ParticipantType): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = participantType;
    const { broadcast } = getState();
    const existingChat = R.path(['chats', chatId], broadcast);
    const participant = R.path(['participants', participantType], broadcast);
    const connection = R.path(['stream', 'connection'], participant);
    if (existingChat) {
      dispatch({ type: 'DISPLAY_CHAT', chatId, display: true });
    } else {
      dispatch({ type: 'START_NEW_PARTICIPANT_CHAT', participantType, participant: R.assoc('connection', connection, participant) });
    }
  };

module.exports = {
  initializeBroadcast,
  resetBroadcastEvent,
  startCountdown,
  setBroadcastEventWithCredentials,
  connectPrivateCall,
  reorderActiveFans,
  chatWithActiveFan,
  chatWithParticipant,
};
