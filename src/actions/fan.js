// @flow
import R from 'ramda';
import platform from 'platform';
import { toastr } from 'react-redux-toastr';
import uuidv4 from 'uuid/v4';
import { validateUser } from './auth';
import firebase from '../services/firebase';
import {
  setBroadcastEvent,
  setBroadcastState,
  updateParticipants,
  setBroadcastEventStatus,
  setBackstageConnected,
  setReconnecting,
  setReconnected,
  setDisconnected,
  setPrivateCall,
  onChatMessage,
  monitorVolume,
} from './broadcast';
import { setInfo, resetAlert, setCameraError } from './alert';
import opentok from '../services/opentok';
import {
  Analytics,
  logVariation,
  logAction,
} from '../services/logging';
import takeSnapshot from '../services/snapshot';
import networkTest from '../services/networkQuality';
import { getEventWithCredentials, getEmbedEventWithCredentials } from '../services/api';
import { fanTypeByStatus, isUserOnStage } from '../services/util';

const { toggleLocalAudio, toggleLocalVideo } = opentok;

const fanRadomKey = uuidv4();
const fanUid = (): UserId => `${firebase.auth().currentUser.uid}-${fanRadomKey}`;
let analytics;

/**
 * Redirect the fan when the event ends
 */
const redirectFan = (url: string) => {
  if (url) window.top.location = url;
};

// Set the subscribers fitMode
const setFitMode: ActionCreator = (fitMode: FitMode): FanAction => ({
  type: 'SET_FITMODE',
  fitMode,
});

// Set the fan's publisher minimized
const setPublisherMinimized: ActionCreator = (minimized: boolean): FanAction => ({
  type: 'SET_PUBLISHER_MINIMIZED',
  minimized,
});

// Set the fan's name
const setFanName: ActionCreator = (fanName: string): FanAction => ({
  type: 'SET_FAN_NAME',
  fanName,
});

// Is the fan able to join the interactive session
const setAbleToJoin: ActionCreator = (ableToJoin: boolean): FanAction => ({
  type: 'SET_ABLE_TO_JOIN',
  ableToJoin,
});

/**
 * Update the fan status and the producer chat (if exists)
 */
const setFanStatus: ThunkActionCreator = (status: FanStatus): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const state = getState();
    const existingChat = R.path(['broadcast', 'chats', 'producer'], state);
    if (existingChat) {
      const update = fanTypeByStatus(status);
      dispatch({ type: 'UPDATE_CHAT_PROPERTY', chatId: 'producer', property: 'fromType', update });
    }
    dispatch({ type: 'SET_FAN_STATUS', status });
  };


/**
 * Create a snapshot for the producer
 */
const createSnapshot = async (publisher: Publisher): ImgData => {
  try {
    const fanSnapshot = await takeSnapshot(publisher.getImgData()); // $FlowFixMe @TODO: resolve flow error
    return fanSnapshot;
  } catch (error) {
    console.log('Failed to create fan snapshot'); // $FlowFixMe @TODO: resolve flow error
    return null;
  }
};

/**
 * Start checking and reporting the network quality of the fan every 15 seconds
 */
const setupNetworkTest: ThunkActionCreator = (fanId: UserId, adminId: UserId, fanUrl: string): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      // Get an existing host or celebrity subscriber object
      const hostOrCelebSubscriber = (): TestSubscriber | void => {
        const coreState = opentok.state('stage');
        const isHostOrCeleb = ({ stream }: { stream: Stream }): boolean => {
          const { userType } = JSON.parse(R.pathOr(null, ['connection', 'data'], stream));
          return R.contains(userType, ['host', 'celebrity']);
        };
        return R.find(isHostOrCeleb, R.values(coreState.subscribers.camera));
      };
      // Use an available subscriber or create a new test subscriber
      const getSubscriber = async (): Promise<TestSubscriber> => hostOrCelebSubscriber() || opentok.createTestSubscriber('backstage');

      let subscriber: TestSubscriber = await getSubscriber();
      const updateNetworkQuality = async (): AsyncVoid => {
        const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanId}`);
        const networkQuality: QualityRating => NetworkQuality = R.cond([
          [R.isNil, R.always(null)],
          [R.equals(5), R.always('great')],
          [R.lte(3), R.always('good')],
          [R.gt(3), R.always('poor')],
        ]);
        try {
          // If the subscriber is no longer available, get or create a new one
          if (!subscriber.stream) {
            subscriber = await getSubscriber();
          }
          const qualityRating: QualityRating = await networkTest({ subscriber });
          ref.update({ networkQuality: networkQuality(qualityRating) });
        } catch (error) {
          console.log(error);
          ref.update({ networkQuality: null });
        }
      };
      updateNetworkQuality();
      const interval = setInterval(updateNetworkQuality, 15 * 1000);
      dispatch({ type: 'SET_NETWORK_TEST_INTERVAL', interval });
    } catch (error) {
      console.log('Failed to set up network test', error);
      const timeout = setTimeout((): void => dispatch(setupNetworkTest(fanId, adminId, fanUrl)), 3000);
      dispatch({ type: 'SET_NETWORK_TEST_TIMEOUT', timeout });
    }
  };

/**
 * Cancel network connection sampling when fan leaves the line or disconnects
 */
const cancelNetworkTest: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const { interval, timeout } = getState().fan.networkTest;
    interval && clearInterval(interval);
    timeout && clearTimeout(timeout);
    dispatch({ type: 'SET_NETWORK_TEST_INTERVAL', interval: null });
    dispatch({ type: 'SET_NETWORK_TEST_TIMEOUT', timeout: null });
  };

/**
 * Handle a new chat message from the producer
 */
const receivedChatMessage: ThunkActionCreator = (connection: Connection, message: ChatMessage): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = 'producer';
    const state = getState();
    const existingChat = R.pathOr(null, ['broadcast', 'chats', chatId], state);
    const fromId = fanUid();
    const actions = [
      ({ type: 'START_NEW_PRODUCER_CHAT', fromType: fanTypeByStatus(R.prop('status', state.fan)), fromId, producer: { connection } }),
      ({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, message) }),
      onChatMessage(chatId),
    ];
    R.forEach(dispatch, existingChat ? R.tail(actions) : actions);
  };

/**
 * Remove the fan's record from firebase
 */
const removeActiveFanRecord: ThunkActionCreator = (event: BroadcastEvent): Thunk =>
  async (): AsyncVoid => {
    const fanId = fanUid();
    const { fanUrl, adminId } = event;
    const record = {
      id: fanId,
    };
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanId}`);
    try {
      ref.set(record);
    } catch (error) {
      console.log('Failed to remove active fan record: ', error);
    }
  };

/**
 * Leave the line
 */
const leaveTheLine: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const state = getState();
    const event = R.path(['broadcast', 'event'], state);
    const isLive = R.equals('live', event.status);
    const fanOnStage = R.equals('stage', R.path(['fan', 'status'], state));
    await opentok.disconnectFromInstance('backstage');
    if (fanOnStage) await isLive ? opentok.unpublish('stage') : opentok.endCall('stage');
    dispatch(cancelNetworkTest());
    dispatch(setBackstageConnected(false));
    dispatch(removeActiveFanRecord(event));
    dispatch(setFanStatus('disconnected'));
  };

/**
 * Start or end a private call with the producer
 */
const handlePrivateCall: ThunkActionCreator = (inPrivateCall: boolean): Thunk =>
  (dispatch: Dispatch) => {
    const producerStream = opentok.getStreamByUserType('backstage', 'producer');
    const action = inPrivateCall ? 'subscribeToAudio' : 'unsubscribeFromAudio';
    producerStream && opentok[action]('backstage', producerStream);
    dispatch({ type: 'SET_FAN_PRIVATE_CALL', inPrivateCall });
  };

/**
 * Update the fan's streamId in firebase
 */
const updateStream: ThunkActionCreator = (streamId: string): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const fanId = fanUid();
    const event = R.prop('event', getState().broadcast);
    const { fanUrl, adminId } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanId}`);
    try {
      ref.update({ streamId });
    } catch (error) {
      console.log('Failed to update fan stream id in firebase', error);
    }
  };

const onSignal = (dispatch: Dispatch, getState: GetState): SignalListener =>
  async ({ type, data, from }: Signal): AsyncVoid => {
    const { fan, broadcast } = getState();
    const event = R.prop('event', broadcast);
    const signalData = data ? JSON.parse(data) : {};
    const signalType = R.last(R.split(':', type));
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';
    const isStage = R.equals(R.prop('status', fan), 'stage');
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
      case 'chatMessage':
        dispatch(receivedChatMessage(from, signalData));
        break;
      case 'openChat':
        // @TODO - Do we need this? Chat automatically opens with new messages
        break;
      case 'finishEvent':
        dispatch(setBroadcastEventStatus('closed'));
        dispatch(cancelNetworkTest());
        redirectFan(event.redirectUrl);
        break;
      case 'joinBackstage':
        dispatch(setFanStatus('backstage'));
        break;
      case 'disconnectBackstage':
        dispatch(setFanStatus('inLine'));
        break;
      case 'disconnect':
        {
          dispatch(leaveTheLine());
          const message =
            `Thank you for participating, you are no longer sharing video/voice.
            You can continue to watch the session at your leisure.'`;
          toastr.success(message, { showCloseButton: false });
          break;
        }
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
          const { publisher } = await opentok.startCall('stage');
          dispatch(updateStream(publisher.stream.streamId));
          /* Start subscribing from onstage */
          opentok.subscribeAll('stage');
          break;
        }
      default:
        break;
    }
  };

/**
 * Build the configuration options for the opentok service
 */
const opentokConfig = (userCredentials: UserCredentials, dispatch: Dispatch, getState: GetState): CoreInstanceOptions[] => {

  const broadcast = R.defaultTo({})(R.prop('broadcast', getState));
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
      const { userType } = JSON.parse(stream.connection.data);
      const state = getState();
      const fitMode = R.path(['fan', 'fitMode'], state);
      const isLive = R.equals('live', R.path(['broadcast', 'event', 'status'], state));
      const fanOnStage = R.equals('stage', R.path(['fan', 'status'], state));
      const userHasJoined = R.equals(type, 'streamCreated');
      const postProduction = R.path(['fan', 'postProduction'], state);
      const subscribeToAudio = !postProduction || R.equals('fan', userType);
      const options = { subscribeToAudio, fitMode };
      const subscribeStage = (isLive || fanOnStage || postProduction) && userHasJoined && isStage;
      const subscribeBackStage = userHasJoined && R.equals('producer', userType) && !isStage;
      subscribeStage && opentok.subscribe('stage', stream, options);
      // Subscribe to producer audio for private call
      subscribeBackStage && opentok.subscribe('backstage', stream);
      if (isStage) {
        dispatch(updateParticipants(userType, type, stream));
      }
    };

    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);

    // Assign signal listener
    instance.on('signal', onSignal(dispatch, getState));

    // Assign reconnection event listeners
    instance.on('sessionReconnecting', (): void => dispatch(setReconnecting()));
    instance.on('sessionReconnected', (): void => dispatch(setReconnected()));
    instance.on('sessionDisconnected', (event: OTEvent) => {
      if (event.reason === 'forceDisconnected') {
        dispatch(leaveTheLine());
      } else {
        dispatch(setDisconnected());
      }
    });
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
        fitMode: R.path(['fan', 'fitMode'], getState()),
      },
    },
    controlsContainer: null,
    largeScale: true,
  });

  const stage = (): CoreInstanceOptions => {
    const { apiKey, stageSessionId, stageToken } = userCredentials;
    const credentials = {
      apiKey,
      sessionId: stageSessionId,
      token: stageToken,
    };
    const isBroadcastLive: boolean = R.propEq('status', 'live', broadcast);
    const autoPublish: boolean = false;
    const autoSubscribe: boolean = isBroadcastLive;
    return {
      name: 'stage',
      coreOptions: coreOptions('stage', credentials, 'fan', autoSubscribe),
      eventListeners,
      opentokOptions: { autoPublish },
    };
  };

  const backstage = (): CoreInstanceOptions => {
    const { apiKey, sessionId, backstageToken } = userCredentials;
    const credentials = {
      apiKey,
      sessionId,
      token: backstageToken,
    };
    const autoPublish: boolean = true;
    return {
      name: 'backstage',
      coreOptions: coreOptions('backstage', credentials, 'backstageFan', false),
      eventListeners,
      opentokOptions: { autoPublish },
    };
  };

  return [stage(), backstage()];

};

const monitorPrivateCall: ThunkActionCreator = (fanId: UserId): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const event = R.prop('event', getState().broadcast);
    const { adminId, fanUrl } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/privateCall`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const update: PrivateCallState = snapshot.val();
      const fan = getState().fan;
      const fanType = fanTypeByStatus(fan.status);
      const onStage = isUserOnStage(fanType);
      const broadcast = getState().broadcast;
      const currentState: PrivateCallState = broadcast.privateCall;
      // No change
      if (R.equals(currentState, update)) {
        return;
      }

      // We don't need to worry if we're not in the same session
      if (!!update && (isUserOnStage(R.prop('callWith', update)) !== onStage)) {
        dispatch(setPrivateCall(update));
        return;
      }

      // A new call
      if (R.isNil(currentState) && !!update) {
        if (R.equals(fanType, update.isWith) && R.equals(fanId, update.fanId)) {
          // If the call is with us, we need to subcribe only to producer audio
          opentok.unsubscribeAll('stage', true);
          // const instance = onStage ? 'stage' : 'backstage';
          const instance = 'backstage';
          const producerStream = opentok.getStreamByUserType(instance, 'producer');
          opentok.subscribeToAudio(instance, producerStream);
        } else if (isUserOnStage(update.isWith) && onStage) {
          // Need to unsubscribe from the audio of this person
          // $FlowFixMe - We're checking for activeFan above
          opentok.unsubscribeFromAudio('stage', opentok.getStreamByUserType('stage', update.isWith));
        }
      }

      // Call ended
      if (!!currentState && R.isNil(update)) {
        if (R.propEq('isWith', fanType, currentState) && R.propEq('fanId', fanId, currentState)) {
          // Stop subscribing to producer audio, start subscribing to everyone else
          opentok.subscribeAll('stage', true);
          // const instance = onStage ? 'stage' : 'backstage';
          const instance = 'backstage';
          const producerStream = opentok.getStreamByUserType(instance, 'producer');
          producerStream && opentok.unsubscribeFromAudio(instance, producerStream);
          // Update our record in firebase
          const activeFanRef = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanId}`);
          activeFanRef.update({ inPrivateCall: false });
        } else if (isUserOnStage(currentState.isWith) && onStage) {
          // $FlowFixMe - The user is on stage and cannot be a fan in line (activeFan)
          const stream = opentok.getStreamByUserType('stage', currentState.isWith);
          opentok.subscribeToAudio('stage', stream);
        }
      }

      dispatch(setPrivateCall(update));
    });
  };

const monitorProducer: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const event = R.prop('event', getState().broadcast);
    const { adminId, fanUrl } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/producerActive`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const fanOnBackstage = R.equals('backstage', R.path(['fan', 'status'], getState()));
      const producerActive: ProducerActiveState = snapshot.val();
      /* If the producer disconnects and the fan is on backstage, let put the fan in line */
      if (!producerActive && fanOnBackstage) {
        dispatch(setFanStatus('inLine'));
        // Update our record in firebase
        const activeFanRef = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanUid()}`);
        activeFanRef.update({ isBackstage: false });
      }
    });
  };

/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator = (userCredentials: UserCredentials): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const instances: CoreInstanceOptions[] = opentokConfig(userCredentials, dispatch, getState);
    const fanId = fanUid();
    opentok.init(instances);
    analytics.log(logAction.fanConnectsOnstage, logVariation.attempt);
    try {
      await opentok.connect(['stage']);
      analytics.log(logAction.fanConnectsOnstage, logVariation.success);
    } catch (error) {
      analytics.log(logAction.fanConnectsOnstage, logVariation.fail);
    }
    dispatch(setBroadcastState(opentok.state('stage')));
    dispatch(monitorVolume());
    dispatch(monitorProducer());
    dispatch(monitorPrivateCall(fanId));
  };

/**
 * Create an active fan record in firebase
 */
const createActiveFanRecord: ThunkActionCreator = (uid: UserId, adminId: string, fanUrl: string): Thunk =>
  async (): AsyncVoid => {
    /* Create a record in firebase */
    const record = {
      id: uid,
    };
    const fanRef = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${uid}`);
    try {
      // Automatically remove the active fan record on disconnect event
      fanRef.onDisconnect().remove((error: Error): void => error && console.log(error));
      fanRef.set(record);
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Update the active fan record in firebase
 */
const updateActiveFanRecord: ThunkActionCreator = (name: string, event: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const fanId = fanUid();
    const { adminId, fanUrl } = event;
    /* Create the snapshot and send it to the producer via firebase */
    const publisher = opentok.getPublisher('backstage');
    const record = {
      name,
      id: fanId,
      browser: platform.name === 'IE' ? 'internet-explorer' : platform.name,
      os: platform.os.family,
      mobile: platform.manufacturer !== null,
      snapshot: await createSnapshot(publisher),
      streamId: publisher ? publisher.stream.streamId : null,
      isBackstage: false,
      inPrivateCall: false,
    };
    const fanRef = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/activeFans/${fanId}`);
    try {
      fanRef.update(record);
      dispatch(setupNetworkTest(fanId, adminId, fanUrl));
      fanRef.on('value', (snapshot: firebase.database.DataSnapshot) => {
        const update = snapshot.val();
        if (update) {
          const { inPrivateCall, isBackstage } = update;
          isBackstage && dispatch(setFanStatus('backstage'));
          dispatch(handlePrivateCall(inPrivateCall));
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

const connectToPresence: ThunkActionCreator = (adminId: UserId, fanUrl: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const fanId = fanUid();
    const query = await firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}`).once('value');
    const closedEvent = { status: 'closed' };
    const activeBroadcast = query.val() || closedEvent;
    const { activeFans, interactiveLimit, hlsEnabled } = activeBroadcast;
    const useSafari = platform.name === 'Safari';
    /* Check if the fan is able to join to the interactive broadcast. If not, the fan will see the HLS video */
    const ableToJoin = !useSafari && (!interactiveLimit || !activeFans || (activeFans && R.length(R.keys(activeFans)) < interactiveLimit));
    dispatch(setAbleToJoin(ableToJoin));
    if (ableToJoin) {
      /* Create new record to update the presence */
      dispatch(createActiveFanRecord(fanId, adminId, fanUrl));
      const eventData = getState().broadcast.event;

      /* Connect to interactive */
      const credentialProps = ['apiKey', 'sessionId', 'stageSessionId', 'stageToken', 'backstageToken'];
      const credentials = R.pick(credentialProps, eventData);
      /* Init OT Logging */
      analytics = new Analytics(window.location.origin, credentials.stageSessionId, null, credentials.apiKey);
      dispatch(connectToInteractive(credentials, fanId, adminId, fanUrl));
    } else if (!hlsEnabled) {
      const options = (): AlertPartialOptions => ({
        title: ["<div style='color: #3dbfd9; font-size:22px'>This show is over the maximum number of participants.</div>"].join(''),
        text: "<h4 style='font-size:1.2em'>Please try again in a few minutes.</h4>",
        showConfirmButton: false,
        html: true,
        type: null,
        allowEscapeKey: false,
      });
      dispatch(setInfo(options()));
    } else {
      /* HLS enabled */
      const eventData = {
        name: activeBroadcast.name,
        status: activeBroadcast.status,
        startImage: activeBroadcast.startImage,
        endImage: activeBroadcast.endImage,
        hlsUrl: activeBroadcast.hlsUrl,
      };
      dispatch(setBroadcastEvent(eventData));

      /* Let's keep the store updated in case the producer change the event status. */
      const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}`);
      ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
        /* Check if the event status and/or hlsUrl have changed */
        const updates: ActiveBroadcast = snapshot.val() || closedEvent;
        eventData.status = updates.status;
        eventData.hlsUrl = updates.hlsUrl;

        /* If the event is closing, let's give a few seconds more to the fan to finish the last part of the event */
        const hlsDelay = 15; // seconds
        const delay = updates.status === 'closed' ? hlsDelay * 1000 : 0;
        setTimeout((): void => dispatch(setBroadcastEvent(eventData)), delay);
      });
    }
  };

const initializeBroadcast: ThunkActionCreator = ({ adminId, userUrl, fitMode }: FanInitOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get an Auth Token
      await dispatch(validateUser(adminId, 'fan', userUrl));

      // If the user receives an auth error here means there's no event.
      if (R.prop('error', getState().auth)) return;

      // Set fitMode for subscribers
      fitMode && dispatch(setFitMode(fitMode));

      /* Get the event data */
      const data = { adminId, fanUrl: userUrl, userType: 'fan' };
      const eventData: BroadcastEvent = userUrl ?
        await getEventWithCredentials(data, R.prop('authToken', getState().auth)) :
        await getEmbedEventWithCredentials(data, R.prop('authToken', getState().auth));
      dispatch(setBroadcastEvent(eventData));

      // Connect to firebase and check the number of viewers
      firebase.auth().onAuthStateChanged(async (user: InteractiveFan): AsyncVoid => {
        if (user) {
          dispatch(connectToPresence(adminId, eventData.fanUrl));
        } else {
          await firebase.auth().signInAnonymously();
        }
      });

    } catch (error) {
      console.log('error', error);
    }
  };

const connectToBackstage: ThunkActionCreator = (fanName: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    /* Close the prompt */
    dispatch(resetAlert());

    /* Ensure the publisher is not minimzed */
    dispatch(setPublisherMinimized(false));

    /* Save the fan name in the storage */
    dispatch(setFanName(fanName));

    /* Connect to backstage session */
    analytics.log(logAction.fanConnectsBackstage, logVariation.attempt);
    analytics.log(logAction.fanPublishesBackstage, logVariation.attempt);
    try {
      await opentok.connect(['backstage']);
      analytics.log(logAction.fanConnectsBackstage, logVariation.success);
      analytics.log(logAction.fanPublishesBackstage, logVariation.success);

      /* Save the new backstage connection state */
      dispatch(setBackstageConnected(true));

      /* Save the fan status  */
      dispatch(setFanStatus('inLine'));

      /* update the record in firebase adding the fan name + snapshot */
      dispatch(updateActiveFanRecord(fanName, R.path(['broadcast', 'event'], getState())));
    } catch (error) {
      if (error.code === 1500) {
        analytics.log(logAction.fanConnectsBackstage, logVariation.success);
        dispatch(setCameraError());
        dispatch(leaveTheLine());
      } else {
        analytics.log(logAction.fanConnectsBackstage, logVariation.fail);
      }
      analytics.log(logAction.fanPublishesBackstage, logVariation.fail);
    }
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
      onConfirm: (inputValue: string): void => dispatch(connectToBackstage(inputValue || 'Anonymous')),
    });
    dispatch(setFanStatus('connecting'));
    dispatch(R.isEmpty(fanName) ? setInfo(options()) : connectToBackstage(fanName));
  };

module.exports = {
  initializeBroadcast,
  getInLine,
  leaveTheLine,
  setPublisherMinimized,
};
