// @flow
import Core from 'opentok-accelerator-core';
import R from 'ramda';

let coreStage;
let coreBackstage;

const otEvents: SubscribeEventType[] = [
  'subscribeToCamera',
  'unsubscribeFromCamera',
];

const otStreamEvents: StreamEventType[] = [
  'streamCreated',
  'streamDestroyed',
];

const coreOptions = (credentials: SessionCredentials, publisherRole: UserRole, autoSubscribe: boolean = true): CoreOptions => ({
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

const unsubscribeAll = (stage: boolean): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = stage ? coreStage : coreBackstage;
  const subscribers = core.internalState.subscribers.camera;
  Object.values(subscribers).forEach(core.unsubscribe);
  return core.internalState.getPubSub();
};

const subscribeAll = (stage: boolean): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = stage ? coreStage : coreBackstage;
  const streams = core.internalState.getStreams();
  Object.values(streams).forEach(core.subscribe);
  return core.internalState.getPubSub();
};

const connect = async (userCredentials: UserCredentials, userType: UserRole, listeners: OTListeners): AsyncVoid => {
  const { apiKey, backstageToken, stageToken, stageSessionId, sessionId } = userCredentials;
  const stageCredentials = {
    apiKey,
    sessionId: stageSessionId,
    token: stageToken,
  };
  const backstageCredentials = {
    apiKey,
    sessionId,
    token: backstageToken,
  };

  const { onStateChanged, onStreamChanged, onSignal } = listeners;
  const isCelebHost = R.equals('celebrity', userType) || R.equals('host', userType);
  const isFan = R.equals('fan', userType);

  // Connect the listeners with the OTCore object
  const connectListeners = (otCore: Core) => {
    // Assign listener for state changes
    otEvents.forEach((e: SubscribeEvent): void => otCore.on(e, (state: CoreState) => {
      onStateChanged(state);
    }));

    // Assign listener for stream changes
    otStreamEvents.forEach((e: StreamEvent): void => otCore.on(e, ({ stream }: StreamEvent) => {
      e === 'streamCreated' && !isFan && coreStage.subscribe(stream);
      const connectionData = JSON.parse(stream.connection.data);
      onStreamChanged(connectionData.userType, e, stream);
    }));

    // Assign listener for signal changes
    otCore.on('signal', onSignal);
  };

  try {
    // Core and SDK Wrapper should have 'connected' properties returned by state
    // They should also wrap disconnect in try/catch in case a user tries to disconnect before connecting
    if (stageToken) {
      coreStage = new Core(coreOptions(stageCredentials, userType, false));
      connectListeners(coreStage);
    }

    if (backstageToken) {
      coreBackstage = new Core(coreOptions(backstageCredentials, userType, false));
      connectListeners(coreBackstage);
    }

    await Promise.all([coreStage && coreStage.connect(), coreBackstage && coreBackstage.connect()]);

    // Start subscribing and publishing
    isCelebHost && coreStage.startCall();

    return;
  } catch (error) {
    throw error;
  }
};

const disconnect: Unit = () => {
  try {
    coreStage && coreStage.off();
    coreStage && coreStage.disconnect();
    coreBackstage && coreBackstage.off();
    coreBackstage && coreBackstage.disconnect();
  } catch (error) {
    console.log('error disconnect', error);
  }
};

const getStreamByUserType = (userType: string, core: Core): Stream => {
  let stream;
  const printKeyConcatValue = (value: object) => {
    const connectionData = JSON.parse(R.path(['connection', 'data'], value));
    if (connectionData.userType === userType) {
      stream = value;
    }
  };
  R.forEachObjIndexed(printKeyConcatValue, core.state().streams);
  return stream;
};

const changeVolume = (userType: string, volume: number, stage: boolean) => {
  const core = stage ? coreStage : coreBackstage;
  const stream = getStreamByUserType(userType, core);
  if (stream) {
    const subscribers = core.getSubscribersForStream(stream);
    subscribers.forEach((subscriber: Subscriber): Subscriber => subscriber.setAudioVolume(volume));
  }
};

const signal = ({ type, data, to }: SignalParams, stage: boolean) => {
  try {
    const core: Core = stage ? coreStage : coreBackstage;
    core.signal(type, data, to);
  } catch (error) {
    console.log('error coreStage', error);
  }
};

const toggleLocalVideo = (enable: boolean): void => coreStage.toggleLocalVideo(enable);
const toggleLocalAudio = (enable: boolean): void => coreStage.toggleLocalAudio(enable);

module.exports = {
  connect,
  disconnect,
  signal,
  toggleLocalVideo,
  toggleLocalAudio,
  changeVolume,
  unsubscribeAll,
  subscribeAll,
};
