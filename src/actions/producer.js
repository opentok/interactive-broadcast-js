// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo, resetAlert, setBlockUserAlert } from './alert';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import firebase from '../services/firebase';
import opentok from '../services/opentok';
import {
  setBroadcastEventStatus,
  kickFanFromFeed,
  setBroadcastState,
  updateParticipants,
  updateStageCountdown,
  setBroadcastEvent,
} from './broadcast';

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
        const chatId = R.equals(fromType, 'activeFan') ? `${fromType}${fromId}` : fromType;
        dispatch({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, signalData) });
      }
      break;
    default:
      break;
  }
};

const opentokConfig = (dispatch: Dispatch, getState: GetState, userCredentials: UserCredentials): CoreInstanceOptions[] => {

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
      const backstageFanLeft = type === 'streamDestroyed' && !isStage;
      const connectionData: { userType: UserRole } = JSON.parse(stream.connection.data);
      isStage && dispatch(updateParticipants(connectionData.userType, type, stream));
      backstageFanLeft && dispatch(updateParticipants(connectionData.userType, 'backstageFanLeft', stream));
    };

    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);

    // Assign signal listener
    instance.on('signal', onSignal(dispatch));
  };

  const coreOptions = (name: string, credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = true): CoreOptions => ({
    name,
    credentials,
    streamContainers(pubSub: PubSub, source: VideoType, data: { userType: UserRole }, stream?: Stream): string {
      const { broadcast } = getState();
      const inPrivateCall = R.defaultTo('')(broadcast.inPrivateCall);

      if (R.contains('activeFan', inPrivateCall)) {
        const getStreamId = R.prop('streamId');
        const fanId = R.last(R.split('activeFan', inPrivateCall));
        const fan = R.path(['activeFans', 'map', fanId], broadcast);
        if (!R.equals(getStreamId(fan), getStreamId(stream || {}))) {
          // @TODO
          console.log('Streams do not match.  What do we do here???', pubSub, data);
        }
        return `#videoActiveFan${fan.id}`;
      }
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
    const autoSubscribe = true;
    const credentials = {
      apiKey,
      sessionId: stageSessionId,
      token: stageToken,
    };
    return {
      name: 'stage',
      coreOptions: coreOptions('stage', credentials, 'producer', autoSubscribe),
      eventListeners,
    };
  };

  const backstage = (): CoreInstanceOptions => {
    const { apiKey, sessionId, backstageToken } = userCredentials;
    const autoSubscribe = false;
    const credentials = {
      apiKey,
      sessionId,
      token: backstageToken,
    };
    return {
      name: 'backstage',
      coreOptions: coreOptions('backstage', credentials, 'producer', autoSubscribe),
      eventListeners,
    };
  };

  return [stage(), backstage()];
};

/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator = (userCredentials: UserCredentials): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const instances: CoreInstanceOptions[] = opentokConfig(dispatch, getState, userCredentials);
    opentok.init(instances);
    await opentok.connect(['stage', 'backstage']);
    dispatch(setBroadcastState(opentok.state('stage')));
  };

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { adminId, userType });
      const eventData: HostCelebEventData = await getEventWithCredentials(data, R.path(['auth', 'authToken'], getState()));
      dispatch(setBroadcastEvent(eventData));
    } catch (error) {
      console.log(error);
    }
  };

const updateActiveFans: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const adminId = firebase.auth().currentUser.uid;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${event.fanUrl}`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const isInLine = (record: ActiveFan): boolean => R.has('name', record);
      const activeBroadcast = snapshot.val() || {};
      const viewers: ActiveFanMap = R.propOr({}, 'activeFans', activeBroadcast);
      const interactiveLimit: number = R.propOr(0, 'interactiveLimit', activeBroadcast);
      const archiving = R.prop('archiving', activeBroadcast);
      const fansInLine = R.filter(isInLine, viewers);
      const currentFans = R.path(['broadcast', 'activeFans', 'map'], getState());
      const fansNoLongerActive: ChatId[] = R.difference(R.keys(currentFans), R.keys(fansInLine));
      R.forEach((fanId: ChatId): void => dispatch({ type: 'REMOVE_CHAT', chatId: fanId }), fansNoLongerActive);
      dispatch({ type: 'UPDATE_ACTIVE_FANS', update: fansInLine });
      dispatch({ type: 'UPDATE_VIEWERS', viewers: R.length(R.keys(viewers)) });
      dispatch({ type: 'SET_INTERACTIVE_LIMIT', interactiveLimit });
      dispatch({ type: 'SET_ARCHIVING', archiving });
    });
  };

const connectBroadcast: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
    const credentials = R.pick(credentialProps, await getAdminCredentials(event.id));

    // Register the producer in firebase
    firebase.auth().onAuthStateChanged(async (user: InteractiveFan): AsyncVoid => {
      const uid = user.uid;

      const query = await firebase.database().ref(`activeBroadcasts/${uid}/${event.fanUrl}/stage`).once('value');
      const stageState = query.val();

      /* Let's check if the user has another tab opened */
      if (stageState && stageState[uid] && stageState[uid].userType === 'producer') {
        /* Let the user know that he/she is already connected in another tab */
        dispatch(setBlockUserAlert());
        return;
      }

      const ref = firebase.database().ref(`activeBroadcasts/${uid}/${event.fanUrl}/stage/${uid}`);
      const record = { userType: 'producer' };
      try {
        ref.onDisconnect().remove((error: Error): void => error && console.log(error));
        ref.set(record);
      } catch (error) {
        console.log('Failed to create the record: ', error);
      }

      // Connect to the session
      await dispatch(connectToInteractive(credentials));
      createEmptyPublisher('stage');
      createEmptyPublisher('backstage');
      dispatch(updateActiveFans(event));
      dispatch({ type: 'BROADCAST_CONNECTED', connected: true });

      /* Let the fans know that the admin has connected */
      signal('stage', { type: 'startEvent' });

    });
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const event = R.path(['broadcast', 'event'], getState());
    const uid = firebase.auth().currentUser.uid;
    const ref = firebase.database().ref(`activeBroadcasts/${uid}/${event.fanUrl}/stage/${uid}`);
    try {
      ref.remove((error: Error): void => error && console.log(error));
    } catch (error) {
      console.log('Failed to remove the record: ', error);
    }
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
        setBroadcastEvent(R.evolve(setStatus, event)),
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
 * Start a private call with a broadcast participant
 */
const connectPrivateCall: ThunkActionCreator = (participant: ParticipantType): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {

    const startCall = R.not(R.equals(participant, R.path(['broadcast', 'inPrivateCall'], getState())));
    const type = startCall ? 'privateCall' : 'endPrivateCall';
    const data = { callWith: participant };
    const instance = R.equals(participant, 'backstageFan') ? 'backstage' : 'stage';
    if (startCall) {
      await publishAudio(instance, startCall);
      opentok.unsubscribeAll('stage', true);
      opentok.subscribeToAudio(instance, opentok.getStreamByUserType(instance, participant));
    } else {
      await Promise.all([publishAudio(instance, false), opentok.subscribeAll('stage', true)]);
    }
    signalStage({ type, data });
    const action = startCall ?
      { type: 'START_PRIVATE_PARTICIPANT_CALL', participant } :
      { type: 'END_PRIVATE_PARTICIPANT_CALL' };
    dispatch(action);
  };

const reorderActiveFans: ActionCreator = (update: ActiveFanOrderUpdate): BroadcastAction => ({
  type: 'REORDER_BROADCAST_ACTIVE_FANS',
  update,
});

const sendToBackstage: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Remove the current backstagefan */
    const state = getState();
    const participant = R.path(['broadcast', 'participants', 'backstageFan'], state);
    const event = R.path(['broadcast', 'event'], state);
    participant.stream && await dispatch(kickFanFromFeed('backstageFan'));
    /* Get the stream */
    const stream = opentok.getStreamById('backstage', fan.streamId);
    /* Add the participant to the backstage fan feed and start subscribing */
    dispatch(updateParticipants('backstageFan', 'streamCreated', stream));
    opentok.subscribe('backstage', stream);
    /* Let the fan know that he is on backstage */
    signal('backstage', { type: 'joinBackstage', to: stream.connection });

    /* Let the celeb & host know that there is a new fan on backstage */
    signal('stage', { type: 'newBackstageFan' });
        /* update the record in firebase */
    try {
      const ref = firebase.database().ref(`activeBroadcasts/${R.prop('adminId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
      const activeFanRecord = await ref.once('value');
      if (activeFanRecord.val()) {
        ref.update({ isBackstage: true });
      }
    } catch (error) {
      // @TODO Error handling
      console.log(error);
    }
  };

const sendToStage: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Get the fan that is publishing in Backtage */
    const state = getState();
    const currentFans = R.path(['broadcast', 'activeFans', 'map'], getState());
    const isBackstage = R.propEq('isBackstage', true);
    const fan = R.findLast(isBackstage)(R.values(currentFans));
    if (fan) {
      const stream = opentok.getStreamById('backstage', fan.streamId);
      const event = R.path(['broadcast', 'event'], state);
      const currentFanOnStage = R.path(['broadcast', 'participants', 'fan'], state);
      currentFanOnStage.stream && signal('stage', { type: 'disconnect', to: currentFanOnStage.stream.connection });
      /* Remove the current user in stage */

      /* Send the first signal to the fan */
      signal('backstage', { type: 'joinHost', to: stream.connection });

      /* update the record in firebase */
      try {
        const ref = firebase.database().ref(`activeBroadcasts/${R.prop('adminId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
        const activeFanRecord = await ref.once('value');
        if (activeFanRecord.val()) {
          ref.update({ isOnStage: true, isBackstage: false });
        }
      } catch (error) {
        // @TODO Error handling
        console.log(error);
      }

      /* Display the countdown and send the signal */
      let counter = 5;
      let timer;
      const sendSignal = (): Promise<> => signal('backstage', { type: 'joinHostNow', to: stream.connection });
      const updateCounter = () => {
        dispatch(updateStageCountdown(counter));
        if (counter >= 0) {
          counter -= 1;
        } else {
          clearInterval(timer);
          sendSignal();
        }
      };
      timer = setInterval(updateCounter, 1000);
    }
  };

const chatWithActiveFan: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = `activeFan${fan.id}`;
    const existingChat = R.path(['broadcast', 'chats', chatId], getState());
    const connection = opentok.getConnection('backstage', fan.streamId);
    if (existingChat) {
      const actions = [
        { type: 'DISPLAY_CHAT', chatId, display: true },
        { type: 'MINIMIZE_CHAT', chatId, minimize: false },
      ];
      R.forEach(dispatch, actions);
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

const startActiveFanCall: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const chatId = `activeFan${fan.id}`;
    const { broadcast } = getState();
    const { event } = broadcast;
    const existingChat: ChatState = R.path(['chats', chatId], broadcast);
    if (existingChat) {
      try {
        dispatch({ type: 'PRIVATE_ACTIVE_FAN_CALL', fanId: fan.id, inPrivateCall: true });
        const ref = firebase.database().ref(`activeBroadcasts/${R.prop('adminId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
        await ref.update({ inPrivateCall: true });
        opentok.unsubscribeAll('stage', true);
        opentok.publishAudio('backstage', true);
        opentok.subscribe('backstage', opentok.getStreamById('backstage', fan.streamId));
      } catch (error) {
        // @TODO Error handling
        console.log('Failed to start private call with active fan', error);
      }
    } else {
      R.forEach(dispatch, [chatWithActiveFan(fan), startActiveFanCall(fan)]);
    }
  };

const endActiveFanCall: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    // const chatId = `activeFan${fan.id}`;
    const { broadcast } = getState();
    const { event } = broadcast;
    const fanStream = opentok.getStreamById('backstage', fan.streamId);
    opentok.publishAudio('backstage', false);
    opentok.unsubscribe('backstage', fanStream);
    opentok.subscribeAll('stage', true);
    dispatch({ type: 'PRIVATE_ACTIVE_FAN_CALL', fanId: fan.id, inPrivateCall: false });
    try {
      const ref = firebase.database().ref(`activeBroadcasts/${R.prop('adminId', event)}/${R.prop('fanUrl', event)}/activeFans/${fan.id}`);
      const activeFanRecord = await ref.once('value');
      if (activeFanRecord.val()) {
        ref.update({ inPrivateCall: false });
      }
    } catch (error) {
      // @TODO Error handling
      console.log(error);
    }

  };

/**
 * Update the event status
 */
const changeStatus: ThunkActionCreator = (eventId: EventId, newStatus: EventStatus): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const goLive = newStatus === 'live';
      const type = goLive ? 'goLive' : 'finishEvent';
      /* If the event goes live, the producer should stop publishing to stage session */
      goLive && await opentok.unpublish('stage');
      /* Update the new status in firebase and update the state */
      const actions = [
        updateStatus(eventId, newStatus),
        setBroadcastEventStatus(newStatus),
      ];
      R.forEach(dispatch, actions);
      /* Send a signal to everyone connected to stage with the new status */
      opentok.signal('stage', { type });
    } catch (error) {
      console.log('error on change status ==>', error);
    }
  };

module.exports = {
  initializeBroadcast,
  resetBroadcastEvent,
  startCountdown,
  setBroadcastEventWithCredentials,
  connectPrivateCall,
  reorderActiveFans,
  sendToBackstage,
  chatWithActiveFan,
  startActiveFanCall,
  endActiveFanCall,
  chatWithParticipant,
  sendToStage,
  changeStatus,
};
