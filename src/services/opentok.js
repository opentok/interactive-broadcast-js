// @flow
import Core from 'opentok-accelerator-core';
import R from 'ramda';

const instances: {[name: string]: Core} = {};
const listeners: {[name: string]: Core => void} = {};
const options: {[name: string]: OpentokSessionOptions} = {};
let localInstance;

const getStreamByUserType = (userType: UserRole, core: Core): Stream => {
  const streamByUserType = (stream: Stream): boolean => {
    const connectionData = JSON.parse(R.pathOr(null, ['connection', 'data'], stream)) || {};
    return R.equals(connectionData.userType === userType);
  };
  return R.find(streamByUserType, R.values(core.state().streams));
};

/**
 * Create instances of core
 */
const init = (instancesToCreate: CoreInstanceOptions[], local: string) => {
  const createCoreInstance = ({ name, coreOptions, eventListeners, opentokOptions = {} }: CoreInstanceOptions) => {
    instances[name] = new Core(coreOptions);
    listeners[name] = eventListeners;
    options[name] = opentokOptions;
  };
  R.forEach(createCoreInstance, instancesToCreate);
  localInstance = instances[local];
};

/**
 * Connect to all sessions/instances of core
 */
const connect = async (): AsyncVoid => {

  const connectInstance = async (name: string): AsyncVoid => {
    const instance = instances[name];
    const instanceOptions = options[name];
    listeners[name](instance); // Connect listeners
    const connection = await instance.connect();
    return instanceOptions.autoPublish ? instance.startCall() : connection;
  };

  try {
    const connections = await Promise.all(R.map(connectInstance, R.keys(instances)));
    return connections;
  } catch (error) {
    throw error;
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

const changeVolume = (instance: string, userType: UserRole, volume: number) => {
  const core = instances[instance];
  const stream = getStreamByUserType(userType, core);
  if (stream) {
    const subscribers = core.getSubscribersForStream(stream);
    subscribers.forEach((subscriber: Subscriber): Subscriber => subscriber.setAudioVolume(volume));
  }
};

const signal = async (instance: string, { type, data, to }: SignalParams): AsyncVoid => {
  try {
    const core = instances[instance];
    core.signal(type, data, to);
  } catch (error) {
    console.log('signaling errror', error);
  }
};

/**
 * Subscribe to all streams in the session instance
 */
const subscribeAll = (instance: string): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = instances[instance];
  const streams = core.state().getStreams();
  Object.values(streams).forEach(core.subscribe);
  return core.state().getPubSub();
};

const toggleLocalVideo = (enable: boolean): void => localInstance.toggleLocalVideo(enable);

const toggleLocalAudio = (enable: boolean): void => localInstance.toggleLocalAudio(enable);

/**
 * Unsubscribe from all streams in the instance session
 */
const unsubscribeAll = (instance: string): Object => { // eslint-disable-line flowtype/no-weak-types
  const core = instances[instance];
  const subscribers = core.state().subscribers.camera;
  Object.values(subscribers).forEach(core.unsubscribe);
  return core.state().getPubSub();
};

/**
 * subscribe to a stream
 */
const subscribe = (stream: Stream, instance: string) => {
  const core = instances[instance];
  core.subscribe(stream);
};


module.exports = {
  init,
  connect,
  disconnect,
  changeVolume,
  signal,
  subscribeAll,
  toggleLocalAudio,
  toggleLocalVideo,
  unsubscribeAll,
  subscribe,
};
