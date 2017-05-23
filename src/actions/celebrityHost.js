// @flow
import R from 'ramda';
import { toastr } from 'react-redux-toastr';
import { validateUser } from './auth';
import { startCountdown, setBroadcastEventStatus, updateParticipants, setBroadcastState, startPrivateCall, endPrivateCall } from './broadcast';
import { getEventWithCredentials } from '../services/api';
import opentok from '../services/opentok';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;
const instance = 'stage';

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

const receivedChatMessage: ThunkActionCreator = (connection: Connection, message: ChatMessage, fromType: HostCeleb): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    const chatId = 'producer';
    const state = getState();
    const existingChat = R.pathOr(null, ['broadcast', 'chats', chatId], state);
    const actions = [
      ({ type: 'START_NEW_PRODUCER_CHAT', fromType, producer: { connection } }),
      ({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', false, message) }),
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
        fromProducer && toggleLocalVideo(instance, signalData.video === 'on');
        break;
      case 'muteAudio':
        fromProducer && toggleLocalAudio(instance, signalData.mute === 'off');
        break;
      case 'changeVolume':
        fromProducer && changeVolume(instance, signalData.userType, signalData.volume);
        break;
      case 'chatMessage':
        dispatch(receivedChatMessage(from, signalData, userType));
        break;
      case 'privateCall':
        fromProducer && dispatch(startPrivateCall(signalData.callWith, R.equals(userType, signalData.callWith)));
        break;
      case 'endPrivateCall':
        fromProducer && dispatch(endPrivateCall(userType));
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
    const handlePubSubEvent = (state: CoreState, event: PubSubEventType) => {
      if (R.equals(event, 'startCall')) {
        dispatch(updateParticipants(userType, event, state.publisher.stream));
      }
      dispatch(setBroadcastState(state));
    };
    const pubSubEvents: PubSubEventType[] = ['startCall', 'subscribeToCamera', 'unsubscribeFromCamera'];
    R.forEach((event: PubSubEventType): void => instance.on(event, handlePubSubEvent), pubSubEvents);

    // Assign listener for stream changes
    const otStreamEvents: StreamEventType[] = ['streamCreated', 'streamDestroyed'];
    const handleStreamEvent: StreamEventHandler = ({ type, stream }: OTStreamEvent) => {
      const user: UserRole = R.prop('userType', JSON.parse(stream.connection.data));
      if (R.equals(user, 'producer')) {
        opentok.createEmptySubscriber('stage', stream);
      } else {
        opentok.subscribe('stage', stream);
        dispatch(updateParticipants(user, type, stream));
      }

    };
    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);
    // Assign signal listener
    instance.on('signal', onSignal(dispatch, userType));
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


/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator =
  (userCredentials: UserCredentials, userType: HostCeleb): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    // const { onStateChanged, onStreamChanged, onSignal } = roleListeners;
    const instances: CoreInstanceOptions[] = opentokConfig(dispatch, { userCredentials, userType });
    opentok.init(instances, 'stage');
    await opentok.connect(['stage']);
    dispatch(setBroadcastState(opentok.state('stage')));
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


const initializeBroadcast: ThunkActionCreator = ({ adminId, userType, userUrl }: CelebHostInitOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get/set an Auth Token
      await dispatch(validateUser(adminId, userType, userUrl));
      // Get the event data + OT credentials
      await dispatch(setBroadcastEventWithCredentials(adminId, userType, userUrl));

      // Connect to the session
      const eventData = R.path(['broadcast', 'event'], getState());
      const { apiKey, stageToken, stageSessionId, status } = eventData;
      const credentials = { apiKey, stageSessionId, stageToken };
      status !== 'closed' && await dispatch(connectToInteractive(credentials, userType));
    } catch (error) {
      console.log('error', error);
    }
  };


module.exports = {
  initializeBroadcast,
  startCountdown,
};
