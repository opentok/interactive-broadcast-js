// @flow
import Core from 'opentok-accelerator-core';
import R from 'ramda';

const instances: {[name: string]: Core} = {};
const listeners: {[name: string]: Core => void} = {};
const options: {[name: string]: OpentokSessionOptions} = {};

const getStreamByUserType = (instance: SessionName, userType: UserRole): Stream => {
  const core = instances[instance];
  const streamByUserType = (stream: Stream): boolean => {
    const connectionData = JSON.parse(R.pathOr(null, ['connection', 'data'], stream)) || {};
    return R.equals(connectionData.userType === userType);
  };
  return R.find(streamByUserType, R.values(core.state().streams));
};

const getAllSubscribers = (instance: SessionName): Subscriber[] => R.values(R.prop(instance, instances).state().subscribers.camera);

/**
 * Create instances of core
 */
const init = (instancesToCreate: CoreInstanceOptions[]) => {
  const createCoreInstance = ({ name, coreOptions, eventListeners, opentokOptions = {} }: CoreInstanceOptions) => {
    instances[name] = new Core(coreOptions);
    listeners[name] = eventListeners;
    options[name] = opentokOptions;
  };
  R.forEach(createCoreInstance, instancesToCreate);
};

/**
 * Connect to all sessions/instances of core
 */
const connect = async (instancesToConnect: InstancesToConnect): AsyncVoid => {

  const connectInstance = async (name: SessionName): AsyncVoid => {
    const instance = instances[name];
    const instanceOptions = options[name];
    listeners[name](instance); // Connect listeners
    const connection = await instance.connect();
    return instanceOptions.autoPublish ? instance.startCall() : connection;
  };

  try {
    const connections = await Promise.all(R.map(connectInstance, R.values(instancesToConnect)));
    return connections;
  } catch (error) {
    throw error;
  }
};

const createEmptyPublisher = async (instance: SessionName): AsyncVoid => {
  const core = instances[instance];
  try {
    await core.startCall({ publishVideo: false, videoSource: null });
    return;
  } catch (error) {
    throw error;
  }
};

const publishAudio = async (instance: SessionName, shouldPublish: boolean): AsyncVoid => {
  const core = instances[instance];
  const publisher = R.head(R.values(core.state().publishers.camera));
  if (shouldPublish) {
    if (publisher) {
      publisher.publishAudio(true);
    } else {
      console.log('Cannot stop publishing audio. Local publisher does not exist.');
    }
  } else {
    try {
      await instances[instance].startCall({ publishVideo: false });
      return;
    } catch (error) {
      throw error;
    }
  }
};
/**
 * Disconnect from all sessions/instances of core
 */
const disconnect = () => {

  const disconnectInstance = (instance: Core) => {
    instance.off();
    instance.disconnect();
  };

  try {
    R.forEach(disconnectInstance, R.values(instances));
  } catch (error) {
    console.log('disconnect error', error);
  }
};

/**
 * Disconnect from a particular session/instance of core
 */
const disconnectFromInstance = (instanceToDisconnect: SessionName) => {
  try {
    instances[instanceToDisconnect].off();
    instances[instanceToDisconnect].disconnect();
  } catch (error) {
    console.log('disconnect error', error);
  }
};

const changeVolume = (instance: SessionName, userType: UserRole, volume: number) => {
  const core = instances[instance];
  const stream = getStreamByUserType(instance, userType);
  if (stream) {
    const subscribers = core.getSubscribersForStream(stream);
    subscribers.forEach((subscriber: Subscriber): Subscriber => subscriber.setAudioVolume(volume));
  }
};

const signal = async (instance: SessionName, { type, data, to }: SignalParams): AsyncVoid => {
  try {
    const core: Core = instances[instance];
    core.signal(type, data, to);
  } catch (error) {
    console.log('signaling errror', error);
  }
};

/**
 * Subscribe to all streams in the session instance
 */
const subscribeAll = (instance: SessionName, audioOnly?: boolean = false): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = instances[instance];
  if (audioOnly) {
    R.forEach((s: Subscriber): Subscriber => s.subscribeToAudio(true), getAllSubscribers(instance));
  } else {
    const streams = core.state().getStreams();
    Object.values(streams).forEach(core.subscribe);
  }
  return core.state();
};

const createEmptySubscriber = async (instance: SessionName, stream: Stream): AsyncVoid => {
  const core = instances[instance];
  try {
    await core.subscribe(stream, { subscribeToAudio: false, subscribeToVideo: false });
    return;
  } catch (error) {
    throw error;
  }
};


const toggleLocalVideo = (enable: boolean, instance: SessionName): void => instances[instance].toggleLocalVideo(enable);

const toggleLocalAudio = (enable: boolean, instance: SessionName): void => instances[instance].toggleLocalAudio(enable);

/**
 * Unsubscribe from all streams in the instance session
 */
const unsubscribeAll = (instance: SessionName, audioOnly?: boolean = false): CoreState => { // eslint-disable-line flowtype/no-weak-types
  const core = instances[instance];
  const subscribers: Subscriber[] = getAllSubscribers(instance);
  const action = (s: Subscriber): Subscriber => audioOnly ? s.subscribeToAudio(false) : core.unsubscribe(s);
  R.forEach(action, subscribers);
  return core.state();
};

/**
 * subscribe to a stream
 * TODO: Error handling - this should be an async function
 */
const subscribe = (instance: SessionName, stream: Stream) => {
  const core = instances[instance];
  core.subscribe(stream);
};

const toggleSubscribeAudio = (instance: SessionName, stream: Stream, shouldSubscribe: boolean) => {
  const core = instances[instance];
  const { streamMap, subscribers } = core.state();
  const subscriber = R.prop(R.prop(stream.streamId, streamMap), R.merge(subscribers.camera, subscribers.sip));
  subscriber.subscribeToAudio(shouldSubscribe);
};

const subscribeToAudio: ((SessionName, Stream) => void) = R.partialRight(toggleSubscribeAudio, [true]);

const unsubscribe = (instance: SessionName, stream: Stream) => {
  const core = instances[instance];
  const { streamMap, subscribers } = core.state();
  const subscriber = subscribers.camera[streamMap[stream.streamId]] || subscribers.sip[streamMap[stream.streamId]];
  core.unsubscribe(subscriber);
};

const unSubscribeFromAudio: ((SessionName, Stream) => void) = R.partialRight(toggleSubscribeAudio, [false]);

const state = (instance: SessionName): CoreState => instances[instance].state();


/**
 * get the first publisher in state
 */
const getPublisher = (instance: SessionName): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = instances[instance];
  const publisher = R.path(['publishers', 'camera'], core.state());
  return R.values(publisher)[0];
};

module.exports = {
  init,
  connect,
  disconnect,
  disconnectFromInstance,
  changeVolume,
  getStreamByUserType,
  createEmptyPublisher,
  createEmptySubscriber,
  publishAudio,
  signal,
  subscribeAll,
  toggleLocalAudio,
  toggleLocalVideo,
  unsubscribeAll,
  state,
  subscribe,
  subscribeToAudio,
  unsubscribe,
  unSubscribeFromAudio,
  getPublisher,
};
