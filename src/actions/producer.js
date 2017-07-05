// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo, resetAlert, setBlockUserAlert } from './alert';
import { getEvent, getAdminCredentials, getEventWithCredentials } from '../services/api';
import firebase from '../services/firebase';
import opentok from '../services/opentok';
import { isFan, isUserOnStage, fanTypeForActiveFan } from '../services/util';
import {
  setBroadcastEventStatus,
  setBroadcastEventShowStarted,
  startElapsedTime,
  stopElapsedTime,
  kickFanFromFeed,
  setBroadcastState,
  updateParticipants,
  updateStageCountdown,
  setBroadcastEvent,
  setReconnecting,
  setReconnected,
  setDisconnected,
  setPrivateCall,
  onChatMessage,
} from './broadcast';

const { disconnect, changeVolume, signal, createEmptyPublisher, publishAudio } = opentok;

const notStarted = R.propEq('status', 'notStarted');
const isLive = R.propEq('status', 'live');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };

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
        const chatId = isFan(fromType) ? fromId : fromType;
        dispatch(onChatMessage(chatId));
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

    // Assign reconnection event listeners
    instance.on('sessionReconnecting', (): void => dispatch(setReconnecting()));
    instance.on('sessionReconnected', (): void => dispatch(setReconnected()));
    instance.on('sessionDisconnected', (): void => dispatch(setDisconnected()));
  };

  const coreOptions = (name: string, credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = true): CoreOptions => ({
    name,
    credentials,
    streamContainers(pubSub: PubSub, source: VideoType, data: { userType: UserRole }, stream?: Stream): string {
      const { broadcast } = getState();
      const privateCall = R.defaultTo({})(broadcast.privateCall);
      if (R.propEq('isWith', 'activeFan', privateCall)) {
        const getStreamId = R.prop('streamId');
        const fan = R.path(['activeFans', 'map', R.prop('fanId', privateCall)], broadcast);
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
    largeScale: true,
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


/**
 * Start (or resume) a chat session with an on-stage participant
 */
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


/**
 * Start (or resume) a chat session with a fan
 */
const chatWithActiveFan: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = fan.id;
    const existingChat = R.path(['broadcast', 'chats', chatId], getState());
    if (existingChat) {
      const actions = [
        { type: 'DISPLAY_CHAT', chatId, display: true },
        { type: 'MINIMIZE_CHAT', chatId, minimize: false },
      ];
      R.forEach(dispatch, actions);
    } else {
      const toType = fanTypeForActiveFan(fan);
      const connection = opentok.getConnection('backstage', fan.streamId, 'backstageFan');
      dispatch({ type: 'START_NEW_FAN_CHAT', fan: R.assoc('connection', connection, fan), toType });
    }
  };

/**
 * End the active private call and update firebase, redux stores
 */
const endPrivateCall: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const { broadcast } = getState();
    const privateCall = R.prop('privateCall', broadcast);
    const { adminId, fanUrl } = R.prop('event', broadcast);
    const fanId = R.propOr(null, 'fanId', privateCall);
    const isWithFan = !!fanId;
    const baseRef = `activeBroadcasts/${adminId}/${fanUrl}`;

    // Update fan record in firebase
    try {
      // Update fan record
      if (isWithFan) {
        const fanRef = firebase.database().ref(`${baseRef}/activeFans/${fanId}`);
        await fanRef.update({ inPrivateCall: false });
      }
    } catch (error) {
      // Nothing to do here. If the fan is no longer active and there is no record, that's fine
    }

    // Update broadcast record in firebase
    try {
      const broadcastRef = firebase.database().ref(baseRef);
      await broadcastRef.update({ privateCall: null });
    } catch (error) {
      console.log('Failed to update active broadcast record in firebase', error);
    }

    // Update audio/video subscriptions
    try {
      const { isWith } = privateCall;
      // Stop publishing audio to backstage and start subscribing again to stage
      const fanStream = (): Stream => opentok.getStreamById('backstage', R.path(['map', fanId, 'streamId'], broadcast.activeFans));

      const chatId = isWithFan ? fanId : isWith;
      if (R.path(['chats', chatId], broadcast)) {
        dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId, property: 'inPrivateCall', update: false });
      }

      // Unsubscribe from backstage stream, if needed
      const backstageAction = () => {
        if (R.propEq('isWith', 'activeFan', privateCall)) {
          // Stop subscribing to active fan
          opentok.unsubscribe('backstage', fanStream());
        } else if (R.propEq('isWith', 'backstageFan', privateCall)) {
          // Stop subscribing to backstage fan audio
          opentok.unsubscribeFromAudio('backstage', fanStream());
        }
      };
      backstageAction();
    } catch (error) {
      // Nothing to do here if there is no stream
    }

    const instance = isUserOnStage(R.prop('isWith', privateCall)) ? 'stage' : 'backstage';
    try {
      await Promise.all([opentok.publishAudio(instance, false), opentok.subscribeAll('stage', true)]);
    } catch (error) {
      console.log(`Failed to publish audio to ${instance} or subscribe to stage`, error);
    }

    // Update store
    dispatch(setPrivateCall(null));
  };

const startPrivateCall: ThunkActionCreator = (isWith: PrivateCallParticipant, fanId?: UserId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const { broadcast } = getState();
    const isWithFan = !!fanId;
    const onStage = isUserOnStage(isWith);
    const fan = (): ActiveFan => R.path(['activeFans', 'map', fanId], broadcast);
    const stream = (): Stream => {
      if (!!fanId && !onStage) {
        const fanStreamId = fan().streamId;
        return opentok.getStreamById('backstage', fanStreamId);
      } // $FlowFixMe
      return opentok.getStreamByUserType('stage', isWith); // We know this is NOT 'activeFan'
    };

    try {
      const { adminId, fanUrl } = R.prop('event', broadcast);
      const baseRef = `activeBroadcasts/${adminId}/${fanUrl}`;

      // Update fan record
      if (isWithFan) { // $FlowFixMe
        const fanRef = firebase.database().ref(`${baseRef}/activeFans/${fanId}`); // We check again fanId above
        await fanRef.update({ inPrivateCall: true });

        // If calling an active fan, we need to make sure there is an active chat
        if (R.equals(isWith, 'activeFan')) {
          dispatch(chatWithActiveFan(R.assoc('inPrivateCall', true, fan())));
        }

        // If there is an active chat, we need to update the chat state
        // @TODO Link chat state to active fan state to avoid this(?)
        if (R.path(['chats', fanId], broadcast)) { // $FlowFixMe - We know fanId is defined here (isWithFan)
          dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fanId, property: 'inPrivateCall', update: true });
        }
      }

      // Update broadcast record
      const broadcastRef = firebase.database().ref(`${baseRef}/privateCall`);
      const broadcastUpdate = isWithFan ? { isWith, fanId } : { isWith };
      await broadcastRef.update(broadcastUpdate);


      // We need to dispatch this action before trying to subscribe to get the correct stream container
      dispatch(setPrivateCall({ isWith, fanId }));

      // Publish audio to whichever session
      const instance = onStage ? 'stage' : 'backstage';
      await publishAudio(instance, true);
      opentok.unsubscribeAll('stage', true);
      const subscribeAction = R.equals(isWith, 'activeFan') ? 'subscribe' : 'subscribeToAudio';
      opentok[subscribeAction](instance, stream());
    } catch (error) {
      // @TODO Error handling
      console.log(error);
    }
  };

/**
 * Start or end private calls
 */
const connectPrivateCall: ThunkActionCreator = (isWith: PrivateCallParticipant, fanId?: UserId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const broadcast = getState().broadcast;
    const currentState = broadcast.privateCall;
    const currentlyInCall = !!currentState;
    // If there is not an active call or we want to start a call with someone other than the person in the active call
    const startCall = !currentlyInCall || !R.propEq('isWith', isWith, currentState);
    if (startCall) {
      if (currentlyInCall) {
        dispatch(await endPrivateCall());
      }
      // const onStageFan = R.equals('fan', isWith);
      dispatch(await startPrivateCall(isWith, fanId));
    } else {
      dispatch(await endPrivateCall());
    }
  };

const updateActiveFans: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const adminId = firebase.auth().currentUser.uid;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${event.fanUrl}`);
    ref.on('value', async (snapshot: firebase.database.DataSnapshot): AsyncVoid => {
      const { broadcast } = getState();
      const isInLine = (record: ActiveFan): boolean => R.has('name', record);
      const activeBroadcast = snapshot.val() || {};
      const viewers: ActiveFanMap = R.propOr({}, 'activeFans', activeBroadcast);
      const interactiveLimit: number = R.propOr(0, 'interactiveLimit', activeBroadcast);
      const archiving = R.prop('archiving', activeBroadcast);
      const fansInLine = R.filter(isInLine, viewers);
      const currentFans = R.path(['activeFans', 'map'], broadcast);
      const fansNoLongerActive: UserId[] = R.difference(R.keys(currentFans), R.keys(fansInLine));

      // Update backstage and on-stage fan records
      const backstageFanRecord = R.find(R.whereEq({ isBackstage: true }), R.values(viewers));
      const onStageFanRecord = R.find(R.whereEq({ isOnStage: true }), R.values(viewers));
      backstageFanRecord && dispatch({ type: 'UPDATE_ACTIVE_FAN_RECORD', fanType: 'backstageFan', record: backstageFanRecord });
      onStageFanRecord && dispatch({ type: 'UPDATE_ACTIVE_FAN_RECORD', fanType: 'fan', record: onStageFanRecord });

      R.forEach((fanId: ChatId): void => dispatch({ type: 'REMOVE_CHAT', chatId: fanId }), fansNoLongerActive);

      // Handle the case where a fan in a private call disconnects
      const fanInPrivateCall = R.path(['privateCall', 'fanId'], broadcast);
      const privateCallDisconnected = fanInPrivateCall && R.find(R.equals(fanInPrivateCall), fansNoLongerActive);
      if (privateCallDisconnected) {
        await dispatch(endPrivateCall());
      }

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

      const base = `activeBroadcasts/${uid}/${event.fanUrl}`;
      const ref = firebase.database().ref(`${base}/stage/${uid}`);
      const presenceRef = firebase.database().ref(`${base}/producerActive`);
      const privateCallRef = firebase.database().ref(`${base}/privateCall`);
      try {
        // dispatch(endPrivateCall()); // Why was this here???
        ref.onDisconnect().remove((error: Error): void => error && console.log(error));
        ref.set({ userType: 'producer' });
        presenceRef.onDisconnect().remove((error: Error): void => error && console.log(error));
        presenceRef.set(true);
        privateCallRef.set(null);
        privateCallRef.onDisconnect().remove((error: Error): void => error && console.log(error));
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
      isLive(event) && dispatch(startElapsedTime());
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


const reorderActiveFans: ActionCreator = (update: ActiveFanOrderUpdate): BroadcastAction => ({
  type: 'REORDER_BROADCAST_ACTIVE_FANS',
  update,
});

const sendToBackstage: ThunkActionCreator = (fan: ActiveFan): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Remove the current backstagefan */
    const { broadcast } = getState();

    const participant = R.path(['participants', 'backstageFan'], broadcast);
    const event = R.prop('event', broadcast);
    participant.stream && await dispatch(kickFanFromFeed('backstageFan'));

    /* End the private call */
    if (fan.inPrivateCall) {
      dispatch(connectPrivateCall(fanTypeForActiveFan(fan), fan.id));
    }

    /* Update the chat state to reflect the change in fan status */
    if (R.prop(fan.id, broadcast.chats)) {
      dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fan.id, property: 'toType', update: 'backstageFan' });
    }

    /* Get the stream */
    const stream = opentok.getStreamById('backstage', fan.streamId);
    /* Add the participant to the backstage fan feed and start subscribing */
    dispatch(updateParticipants('backstageFan', 'streamCreated', stream));

    opentok.subscribe('backstage', stream, { subscribeToAudio: false });
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
    /* Get the fan that is publishing in Backstage */
    const { broadcast } = getState();
    const currentFans = R.path(['activeFans', 'map'], broadcast);
    const isBackstage = R.propEq('isBackstage', true);
    const fan = R.findLast(isBackstage)(R.values(currentFans));
    if (fan) {
      const stream = opentok.getStreamById('backstage', fan.streamId);
      const { event } = broadcast;

      /* Remove the current user in stage */
      const currentFanOnStage = R.path(['participants', 'fan'], broadcast);
      currentFanOnStage.stream && signal('stage', { type: 'disconnect', to: currentFanOnStage.stream.connection });

      /* If fan is in private call, end the call before sending to stage. */
      if (fan.inPrivateCall) {
        dispatch(connectPrivateCall(fanTypeForActiveFan(fan), fan.id));
      }

      /* Update chat if exists */
      if (R.path(['chats', fan.id], broadcast)) {
        dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: fan.id, property: 'toType', update: 'fan' });
      }

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
      /* If the event goes live, start the elapsed time counter */
      goLive && dispatch(setBroadcastEventShowStarted());
      /* If the event is finishing, let's stop the elapsed time counter */
      !goLive && dispatch(stopElapsedTime());
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
  chatWithParticipant,
  sendToStage,
  changeStatus,
};
