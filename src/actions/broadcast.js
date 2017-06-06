// @flow
import R from 'ramda';
import { updateStatus } from './events';
import { setInfo, resetAlert } from './alert';
import opentok from '../services/opentok';
import io from '../services/socket-io';

const updateStageCountdown: ActionCreator = (stageCountdown: boolean): BroadcastAction => ({
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

/**
 * Build the configuration options for the opentok service
 */
const opentokConfig = (options: OpentokConfigOptions): CoreInstanceOptions[] => {

  const { userCredentials, userType, listeners } = options;
  const broadcast = R.defaultTo({})(R.prop('broadcast', options));
  // Set common listeners for all user types here
  const eventListeners: CoreInstanceListener = (instance: Core) => {
    const { onStateChanged, onStreamChanged, onSignal } = listeners;

    // Assign listener for state changes
    const subscribeEvents: SubscribeEventType[] = ['subscribeToCamera', 'unsubscribeFromCamera'];
    const handleSubscribeEvent = (state: CoreState): void => onStateChanged(state);
    R.forEach((event: SubscribeEventType): void => instance.on(event, handleSubscribeEvent), subscribeEvents);

    // Assign listener for stream changes
    const otStreamEvents: StreamEventType[] = ['streamCreated', 'streamDestroyed'];
    const handleStreamEvent: StreamEventHandler = ({ type, stream }: OTStreamEvent) => {
      const isStage = R.propEq('name', 'stage', instance);
      const streamCreated = R.equals(type, 'streamCreated');
      const isNotFan = R.not(R.equals(userType, 'fan'));
      const shouldSubscribe = R.all(R.equals(true), [isStage, streamCreated, isNotFan]);
      shouldSubscribe && instance.subscribe(stream);
      const connectionData: { userType: UserRole } = JSON.parse(stream.connection.data);
      onStreamChanged(connectionData.userType, type, stream, isStage);
    };

    R.forEach((event: StreamEventType): void => instance.on(event, handleStreamEvent), otStreamEvents);

    // Assign signal listener
    instance.on('signal', onSignal);
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
    const isHostOrCeleb: boolean = R.contains(userType, ['host', 'celebrity']);
    const isFanAndBroadcastLive: boolean = R.and(R.equals('fan', userType), R.propEq('status', 'live', broadcast));
    const autoPublish: boolean = isHostOrCeleb; // May need to check more expressions here
    const autoSubscribe: boolean = isFanAndBroadcastLive; // May need to check more expressions here
    return {
      name: 'stage',
      coreOptions: coreOptions('stage', credentials, userType, autoSubscribe),
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
    const isFan: boolean = R.contains(userType, ['activeFan', 'fan', 'backstageFan']);
    const autoPublish: boolean = isFan;
    return {
      name: 'backstage',
      coreOptions: coreOptions('backstage', credentials, 'backstageFan', !isFan),
      eventListeners,
      opentokOptions: { autoPublish },
    };
  };

  switch (userType) {
    case 'producer':
      return [stage(), backstage()];
    case 'host':
      return [stage()];
    case 'celebrity':
      return [stage()];
    case 'fan':
      return [stage(), backstage()];
    default:
      return [];
  }
};

// TODO: This might be easier if the type of non-admin/logged-in user were kept in state
const startPrivateCall: ThunkActionCreator = (participant: ParticipantType, connectToProducer?: boolean = false): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    opentok.unsubscribeAll('stage', true);
    if (connectToProducer) {
      const producerStream = opentok.getStreamByUserType('stage', 'producer');
      opentok.subscribeToAudio('stage', producerStream);
    }
    dispatch({ type: 'START_PRIVATE_PARTICIPANT_CALL', participant });
  };

const endPrivateCall: ThunkActionCreator = (participant: ParticipantType, userInCallDisconnected?: boolean = false): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    // See TODO above. We have no way of knowing who the current user is unless we pass the value around
    const currentUserInCall = R.equals(participant, R.path(['broadcast', 'inPrivateCall'], getState()));
    if (R.and(currentUserInCall, !userInCallDisconnected)) {
      opentok.subscribeAll('stage', true);
      opentok.unSubscribeFromAudio('stage', opentok.getStreamByUserType('stage', 'producer'));
    }
    dispatch({ type: 'END_PRIVATE_PARTICIPANT_CALL' });
  };


/**
 * Toggle a participants audio, video, or volume
 */
const toggleParticipantProperty: ThunkActionCreator = (participantType: ParticipantType, property: ParticipantAVProperty): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participant = R.path(['broadcast', 'participants', participantType], getState());
    const currentValue = R.prop(property, participant);

    const update: ParticipantAVPropertyUpdate = R.ifElse(
      R.equals('volume'), // $FlowFixMe
      (): { property: 'volume', value: number } => ({ property, value: currentValue === 100 ? 50 : 100 }), // $FlowFixMe
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
        break;
      case 'video':
        opentok.signal(instance, { type: 'videoOnOff', to, data: { video: value ? 'on' : 'off' } });
        break;
      case 'volume':
        opentok.signal(instance, { type: 'changeVolume', data: { userType: participantType, volume: value ? 100 : 50 } });
        break;
      default: // Do Nothing
    }
    dispatch({ type: 'PARTICIPANT_AV_PROPERTY_CHANGED', participantType, update });
  };


const kickFanFromFeed: ThunkActionCreator = (participantType: ParticipantType): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participant = R.path(['broadcast', 'participants', participantType], getState());
    const to = R.path(['stream', 'connection'], participant);
    const stream = R.path(['stream'], participant);
    const isStage = R.equals('fan', participantType);
    const instance = isStage ? 'stage' : 'backstage';
    const type = isStage ? 'disconnect' : 'disconnectBackstage';
    await opentok.signal(instance, { type, to });
    await opentok.unsubscribe(instance, stream);
    dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
  };

/**
 * Update the participants state when someone joins or leaves
 */
const updateParticipants: ThunkActionCreator = (participantType: ParticipantType, event: StreamEventType, stream: Stream): Thunk =>
  (dispatch: Dispatch, getState: GetState) => {
    switch (event) {
      case 'backstageFanLeft': {
        const participant = R.path(['broadcast', 'participants', 'backstageFan'], getState());
        participant.stream && R.equals(participant.stream.streamId, stream.streamId) && dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
        break;
      }
      case 'streamCreated':
        dispatch({ type: 'BROADCAST_PARTICIPANT_JOINED', participantType, stream });
        break;
      case 'streamDestroyed':
        {
          const inPrivateCall = R.equals(participantType, R.path(['broadcast', 'inPrivateCall'], getState()));
          inPrivateCall && dispatch(endPrivateCall(participantType, true));
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
 * Connect to socket.io
 */
const connectToPresence: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const onConnect = () => {
      dispatch({ type: 'BROADCAST_PRESENCE_CONNECTED', connected: true });
    };
    io.connected ? onConnect() : io.on('connect', onConnect);
  };

/**
 * Connect to OpenTok sessions
 */
const connectToInteractive: ThunkActionCreator =
  (userCredentials: UserCredentials, userType: UserRole, roleListeners: OptionalOTListeners, broadcast?: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const { onStateChanged, onStreamChanged, onSignal } = roleListeners;
    const listeners: OTListeners = {
      onStateChanged: (state: CoreState) => {
        onStateChanged && dispatch(onStateChanged(state));
        dispatch(setBroadcastState(state));
      },
      onStreamChanged: (user: UserRole, event: StreamEventType, stream: Stream, isStage: boolean) => {
        const session = isStage ? 'stage' : 'backstage';
        onStreamChanged && dispatch(onStreamChanged(user, event, stream, session));
        isStage && dispatch(updateParticipants(user, event, stream));
      },
      onSignal,
    };
    const instances: CoreInstanceOptions[] = opentokConfig({ userCredentials, userType, listeners, broadcast });

    opentok.init(instances);
    /* Only the producer should be connected to both sessions from the begining */
    const instancesToConnect = userType === 'producer' ? ['stage', 'backstage'] : ['stage'];
    await opentok.connect(instancesToConnect);
    dispatch(setBroadcastState(opentok.state('stage')));
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    opentok.disconnect();
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
  };


/**
 * Update the event status
 */
const changeStatus: ThunkActionCreator = (eventId: EventId, newStatus: EventStatus): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const actions = [
        updateStatus(eventId, newStatus),
        setBroadcastEventStatus(newStatus),
      ];
      R.forEach(dispatch, actions);
      const type = newStatus === 'live' ? 'goLive' : 'finishEvent';
      opentok.signal('stage', { type });
    } catch (error) {
      console.log('error on change status ==>', error);
    }
  };

/**
 * Start the go live countdown
 */
const startCountdown: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const options = (counter?: number = 1): AlertPartialOptions => ({
      title: 'GOING LIVE IN',
      text: `<h1>${counter}</h1>`,
      showConfirmButton: false,
      html: true,
    });
    let counter = 5;
    const interval = setInterval(() => {
      dispatch(setInfo(options(counter)));
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
    const newBroadcastState = enabled ? opentok.unsubscribeAll('stage') : opentok.subscribeAll('stage');
    const actions = [
      setBroadcastState(newBroadcastState),
      setPublishOnly(enabled),
    ];
    R.forEach(dispatch, actions);
  };

const sendChatMessage: ThunkActionCreator = (chatId: ChatId, message: ChatMessagePartial): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const chat: ChatState = R.path(['broadcast', 'chats', chatId], getState());
    try {
      await opentok.signal(chat.session, { type: 'chatMessage', to: chat.to.connection, data: message });
    } catch (error) {
      // @TODO Error handling
      console.log('Failed to send chat message', error);
    }
    dispatch({ type: 'NEW_CHAT_MESSAGE', chatId, message: R.assoc('isMe', true, message) });
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

module.exports = {
  setBroadcastState,
  opentokConfig,
  connectToInteractive,
  connectToPresence,
  setPublishOnly,
  resetBroadcastEvent,
  startCountdown,
  publishOnly,
  toggleParticipantProperty,
  changeStatus,
  setBroadcastEventStatus,
  updateParticipants,
  startPrivateCall,
  endPrivateCall,
  setBackstageConnected,
  sendChatMessage,
  kickFanFromFeed,
  minimizeChat,
  displayChat,
  updateStageCountdown,
};
