// @flow
import R from 'ramda';
import { toastr } from 'react-redux-toastr';
import { validateUser } from './auth';
import {
  setBroadcastEvent,
  startCountdown,
  setBroadcastEventStatus,
  updateParticipants,
  setBroadcastState,
  endPrivateCall,
  setReconnecting,
  setReconnected,
  setDisconnected,
  setPrivateCall,
  onChatMessage,
  monitorVolume,
} from './broadcast';
import { getEventWithCredentials, getEmbedEventWithCredentials } from '../services/api';
import { isUserOnStage } from '../services/util';
import { setInfo, setCameraError } from './alert';
import firebase from '../services/firebase';
import {
  Analytics,
  logVariation,
  logAction,
} from '../services/logging';
import opentok from '../services/opentok';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;
let analytics;

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

const receivedChatMessage: ThunkActionCreator = (connection: Connection, message: ChatMessage, fromType: HostCeleb): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = 'producer';
    const state = getState();
    const existingChat = R.pathOr(null, ['broadcast', 'chats', chatId], state);
    const actions = [
      ({ type: 'START_NEW_PRODUCER_CHAT', fromType, producer: { connection } }),
      ({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, message) }),
      onChatMessage('producer'),
    ];
    R.forEach(dispatch, existingChat ? R.tail(actions) : actions);
  };

const onSignal = (dispatch: Dispatch, userType: HostCeleb): SignalListener =>
  async ({ type, data, from }: Signal): AsyncVoid => {
    const signalData = data ? JSON.parse(data) : {};
    const signalType = R.last(R.split(':', type));
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';

    switch (signalType) {
      case 'goLive':
        if (fromProducer) {
          R.forEach(dispatch, [setBroadcastEventStatus('live'), startCountdown()]);
        }
        break;
      case 'videoOnOff':
        fromProducer && toggleLocalVideo('stage', signalData.video === 'on');
        break;
      case 'muteAudio':
        fromProducer && toggleLocalAudio('stage', signalData.mute === 'off');
        break;
      case 'changeVolume':
        fromProducer && changeVolume('stage', signalData.userType, signalData.volume);
        break;
      case 'chatMessage':
        dispatch(receivedChatMessage(from, signalData, userType));
        break;
      case 'openChat': // @TODO
      case 'newBackstageFan':
        fromProducer && newBackstageFan();
        break;
      case 'finishEvent':
        fromProducer && dispatch(setBroadcastEventStatus('closed'));
        await opentok.endCall('stage');
        break;
      default:
        break;
    }
  };

/**
 * Build the configuration options for the opentok service
 */
type UserData = { userCredentials: UserCredentials, userType: HostCeleb };
const opentokConfig = (dispatch: Dispatch, { userCredentials, userType }: UserData): CoreInstanceOptions[] => {

  const eventListeners: CoreInstanceListener = (instance: Core) => {
    // const { onStateChanged, onStreamChanged, onSignal } = listeners;

    // Assign listener for state changes
    const handlePubSubEvent = (state: CoreStateWithPublisher, event: PubSubEventType) => {
      if (R.equals(event, 'startCall')) {
        dispatch(updateParticipants(userType, event, R.path(['publisher', 'stream'], state)));
      }
      dispatch(setBroadcastState(state));
    };
    const pubSubEvents: PubSubEventType[] = ['startCall', 'subscribeToCamera', 'unsubscribeFromCamera'];
    R.forEach((event: PubSubEventType): void => instance.on(event, handlePubSubEvent), pubSubEvents);

    // Assign listener for stream changes
    const otStreamEvents: StreamEventType[] = ['streamCreated', 'streamDestroyed'];
    const handleStreamEvent: StreamEventHandler = async ({ type, stream }: OTStreamEvent): AsyncVoid => {
      const user: UserRole = R.prop('userType', JSON.parse(stream.connection.data));
      const streamCreated = R.equals(type, 'streamCreated');
      if (R.equals(user, 'producer')) {
        streamCreated ? opentok.createEmptySubscriber('stage', stream) : dispatch(endPrivateCall(userType, true));
      } else {
        let subscribeAction;
        if (streamCreated) {
          if (userType === 'celebrity') {
            subscribeAction = (user === 'fan') ?
              logAction.celebritySubscribesToFan :
              logAction.celebritySubscribesToHost;
          } else {
            subscribeAction = (user === 'fan') ?
              logAction.hostSubscribesToFan :
              logAction.hostSubscribesToCelebrity;
          } 
          try {
            analytics.log(subscribeAction, logVariation.attempt);
            await opentok.subscribe('stage', stream);
            analytics.log(subscribeAction, logVariation.success);
          } catch (e) {
            analytics.log(subscribeAction, logVariation.fail);
          }
        }
        dispatch(updateParticipants(user, type, stream));
      }

    };
    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);
    // Assign signal listener
    instance.on('signal', onSignal(dispatch, userType));
    // Assign reconnection event listeners
    instance.on('sessionReconnecting', (): void => dispatch(setReconnecting()));
    instance.on('sessionReconnected', (): void => dispatch(setReconnected()));
    instance.on('sessionDisconnected', (): void => dispatch(setDisconnected()));
  };

  // To be moved to opentok service or broadcast actions???
  const coreOptions = (name: string, credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = false): CoreOptions => ({
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
    largeScale: true,
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
      coreOptions: coreOptions('stage', credentials, userType),
      eventListeners,
      opentokOptions: { autoPublish: true },
    };
  };

  return [stage()];
};

const monitorPrivateCall: ThunkActionCreator = (userType: HostCeleb): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {

    const event = R.prop('event', getState().broadcast);
    const { adminId, fanUrl } = event;
    const ref = firebase.database().ref(`activeBroadcasts/${adminId}/${fanUrl}/privateCall`);
    ref.on('value', (snapshot: firebase.database.DataSnapshot) => {
      const { broadcast } = getState();
      const update: PrivateCallState = snapshot.val();
      const currentState: PrivateCallState = broadcast.privateCall;
      // No change
      if (R.equals(currentState, update)) {
        return;
      }

      // We don't need to worry about fans in line or backstage fans
      if (R.contains(R.prop('isWith', update || {}), ['activeFan', 'backstageFan'])) {
        return;
      }

      // A new call
      if (R.isNil(currentState) && !!update) {
        if (R.equals(userType, update.isWith)) {
          // If the call is with us, we need to subcribe only to producer audio
          opentok.unsubscribeAll('stage', true);
          const producerStream = opentok.getStreamByUserType('stage', 'producer');
          opentok.subscribeToAudio('stage', producerStream);
        } else if (isUserOnStage(update.isWith)) {
          // Need to unsubscribe from the audio of this person
          // $FlowFixMe - We're checking for activeFan above
          opentok.unsubscribeFromAudio('stage', opentok.getStreamByUserType('stage', update.isWith));
        }
      }

      // Call ended
      if (!!currentState && R.isNil(update)) {
        if (R.propEq('isWith', userType, currentState)) {
          // Stop subscribing to producer audio, start subscribing to everyone else
          opentok.subscribeAll('stage', true);
          const producerStream = opentok.getStreamByUserType('stage', 'producer');
          opentok.unsubscribeFromAudio('stage', producerStream);
        } else if (isUserOnStage(currentState.isWith)) { // $FlowFixMe - We're checking for activeFan above
          const stream = opentok.getStreamByUserType('stage', currentState.isWith);
          opentok.subscribeToAudio('stage', stream);
        }
      }
      dispatch(setPrivateCall(update));
    });
  };


/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator =
  (userCredentials: UserCredentials, userType: HostCeleb): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    // const { onStateChanged, onStreamChanged, onSignal } = roleListeners;
    const instances: CoreInstanceOptions[] = opentokConfig(dispatch, { userCredentials, userType });
    opentok.init(instances);
    const isHost = userType === 'host';
    const connectAction = isHost ? logAction.hostConnects : logAction.celebrityConnects;
    const publishAction = isHost ? logAction.hostPublishes : logAction.celebrityPublishes;
    const allowDenyAction = isHost ? logAction.hostAcceptsCameraPermissions : logAction.celebrityAcceptsCameraPermissions;
    analytics.log(connectAction, logVariation.attempt);
    analytics.log(publishAction, logVariation.attempt);
    analytics.log(allowDenyAction, logVariation.attempt);
    try {
      await opentok.connect(['stage']);
      analytics.log(connectAction, logVariation.success);
      analytics.log(publishAction, logVariation.success);
      analytics.log(allowDenyAction, logVariation.success);
      dispatch(monitorPrivateCall(userType));
      dispatch(setBroadcastState(opentok.state('stage')));
    } catch (error) {
      if (error.code === 1500) {
        dispatch(setCameraError());
        /* Add logs */
        analytics.log(connectAction, logVariation.success);
        error.name === 'OT_PERMISSION_DENIED' ?
          analytics.log(allowDenyAction, logVariation.fail) :
          analytics.log(allowDenyAction, logVariation.success);
      } else {
        analytics.log(connectAction, logVariation.fail);
      }
      analytics.log(publishAction, logVariation.fail);
    }
  };

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { adminId, userType });
      const eventData: HostCelebEventData = slug ?
        await getEventWithCredentials(data, R.prop('authToken', getState().auth)) :
        await getEmbedEventWithCredentials(data, R.prop('authToken', getState().auth));
      dispatch(setBroadcastEvent(eventData));
    } catch (error) {
      // @TODO Error handling
      console.log(error); // eslint-disable-line no-console
    }
  };


const initializeBroadcast: ThunkActionCreator = ({ adminId, userType, userUrl }: CelebHostInitOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get/set an Auth Token
      await dispatch(validateUser(adminId, userType, userUrl));

      // Get the event data + OT credentials
      await dispatch(setBroadcastEventWithCredentials(adminId, userType, userUrl));

      // Get the eventData
      const eventData = R.path(['broadcast', 'event'], getState());

      // Register the celebrity/host in firebase
      firebase.auth().onAuthStateChanged(async (user: InteractiveFan): AsyncVoid => {
        if (user) {
          const base = `activeBroadcasts/${adminId}/${eventData.fanUrl}`;
          const query = await firebase.database().ref(`${base}/${userType}Active`).once('value');
          const userActive = query.val();

          if (!userActive) { // Prevent duplicated celeb/host
            const ref = firebase.database().ref(`${base}/${userType}Active`);
            const refVolume = firebase.database().ref(`${base}/volume/${userType}`);
            try {
              // eslint-disable-next-line no-console
              ref.onDisconnect().remove((error: Error): void => error && console.log(error));
              refVolume.onDisconnect().remove((error: Error): void => error && console.log(error));
              ref.set(true);
            } catch (error) {
              console.log('Failed to create the record: ', error); // eslint-disable-line no-console
            }
            /* Connect to the session */
            const { apiKey, stageToken, stageSessionId, status } = eventData;
            const credentials = { apiKey, stageSessionId, stageToken };
            analytics = new Analytics(window.location.origin, stageSessionId, null, apiKey);
            if (status !== 'closed') {
              await dispatch(connectToInteractive(credentials, userType));
              dispatch(monitorVolume());
            }
          } else {
            /* Let the user know that he/she is already connected in another tab */
            const options = (): AlertPartialOptions => ({
              title: `<div style='color: #3dbfd9'>There already is a ${userType} using this url.</div>`,
              text: '<h4>If this is you please close all browsers sessions and try again.</h4>',
              showConfirmButton: false,
              html: true,
              type: 'error',
              allowEscapeKey: false,
            });
            dispatch(setInfo(options()));
          }
        } else {
          await firebase.auth().signInAnonymously();
        }
      });
    } catch (error) {
      // @TODO Error handling
      console.log('error', error); // eslint-disable-line no-console
    }
  };


module.exports = {
  initializeBroadcast,
  startCountdown,
};
