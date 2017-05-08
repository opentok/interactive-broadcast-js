// @flow
import R from 'ramda';
import { updateStatus } from './events';
import { setInfo, resetAlert } from './alert';
import opentok from '../services/opentok';
import io from '../services/socket-io';

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
      onStreamChanged(connectionData.userType, type, stream);
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

    return { name: 'backstage', coreOptions: coreOptions('backstage', credentials, userType), eventListeners };
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

const toggleParticipantProperty: ThunkActionCreator = (participantType: ParticipantType, property: ParticipantAVProperty): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    const participants = R.path(['broadcast', 'participants'], getState());
    const to = participants[participantType].stream.connection;
    const computeUpdate = (): ParticipantAVPropertyUpdate => {
      const currentValue = participants[participantType][property];
      switch (property) {
        case 'volume':
          return { property, value: currentValue === 100 ? 50 : 100 };
        case 'audio':
          return { property, value: !currentValue };
        case 'video':
          return { property, value: !currentValue };
        default:
          break;
      }
    };
    const update = computeUpdate();
    const { value } = update;
    const instance = R.equals('backstageFan', participantType) ? 'backstage' : 'stage'; // For moving to OT2
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
    dispatch({ type: 'PARTICIPANT_PROPERTY_CHANGED', participantType, update });
  };

const updateParticipants: ThunkActionCreator = (participantType: ParticipantType, event: StreamEventType, stream: Stream): Thunk =>
  (dispatch: Dispatch): void => {
    switch (event) {
      case 'streamCreated':
        return dispatch({ type: 'BROADCAST_PARTICIPANT_JOINED', participantType, stream });
      case 'streamDestroyed':
        return dispatch({ type: 'BROADCAST_PARTICIPANT_LEFT', participantType });
      default:
        break;
    }
  };

const connectToPresence: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const onConnect = () => {
      dispatch({ type: 'BROADCAST_PRESENCE_CONNECTED', connected: true });
    };
    io.connected ? onConnect() : io.on('connect', onConnect);
  };

const connectToInteractive: ThunkActionCreator = (userCredentials: UserCredentials, userType: UserRole, roleSpecificListeners: OptionalOTListeners, broadcast?: BroadcastEvent): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const { onStateChanged, onStreamChanged, onSignal } = roleSpecificListeners;
    const listeners: OTListeners = {
      onStateChanged: (state: CoreState) => {
        onStateChanged && dispatch(onStateChanged(state));
        dispatch(setBroadcastState(state));
      },
      onStreamChanged: (user: UserRole, event: StreamEventType, stream: Stream) => {
        onStreamChanged && dispatch(onStreamChanged(user, event, stream));
        dispatch(updateParticipants(user, event, stream));
      },
      onSignal,
    };
    const instances: CoreInstanceOptions[] = opentokConfig({ userCredentials, userType, listeners, broadcast });
    opentok.init(instances, 'stage');
    await opentok.connect(userCredentials, userType, listeners);
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    opentok.disconnect();
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
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
      opentok.signal('stage', { type });
    } catch (error) {
      console.log('error on change status ==>', error);
    }
  };

const startCountdown: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const options = (counter ? : number = 1): AlertPartialOptions => ({
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
};
