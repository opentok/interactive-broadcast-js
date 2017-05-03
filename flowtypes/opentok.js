// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type PubSub = 'publisher' | 'subscriber';
declare type VideoType = 'camera' | 'screen';
declare type SessionCredentials = {
  apiKey: string,
  sessionId: string,
  token: string
};
declare type ProducerCredentials = {
  apiKey: string,
  backstageToken: string,
  stageToken: string,
  event: BroadcastEvent // do we need this???
};

declare class OTEvent {
 cancelable: boolean,
 target: Object, // eslint-disable-line flowtype/no-weak-types
 isDefaultPrevented: () => boolean,
 preventDefault: Unit
}

declare type StreamEventType = 'streamCreated' | 'streamDestroyed' | 'streamPropertyChanged';
declare type SubscribeEventType = 'subscribeToCamera' | 'unsubscribeFromCamera';
type SessionEventType = 'sessionConnected' | 'sessionDisconnected' | 'sessionReconnected' | 'sessionReconnecting';
type ConnectionEventType = 'connectionCreated' | 'connectionDestroyed';

declare class OTStreamEvent extends OTEvent {
  type: StreamEventType,
  stream: Stream
}

declare class OTSessionEvent extends OTEvent {
  type: SessionEventType
}

declare class OTConnectionEvent extends OTEvent {
  type: ConnectionEventType
}

declare type Publisher = Object; // eslint-disable-line flowtype/no-weak-types

declare type Subscriber = {
  element: Element,
  id: string,
  stream: Stream,
  getAudioVolume: () => number,
  getImgData: () => string,
  getStats: () => Object, // eslint-disable-line flowtype/no-weak-types
  getStyle: () => Object, // eslint-disable-line flowtype/no-weak-types
  off: (string, (OTEvent) => void, Object) => Object, // eslint-disable-line flowtype/no-weak-types
  on: (string, OTEvent => void, Object) => Object, // eslint-disable-line flowtype/no-weak-types
  once: (string, OTEvent => void, Object) => Object, // eslint-disable-line flowtype/no-weak-types
  restrictFrameRate: (boolean) => Subscriber,
  setAudioVolume: (number) => Subscriber,
  setPreferredFrameRate: (number) => Subscriber,
  setPreferredResolution: ({ width: number, height: number}) => void,
  setStyle: (string, string) => Subscriber,
  subscribeToAudio: (boolean) => Subscriber,
  subscribeToVideo: (boolean) => Subscriber,
  videoHeight: () => number,
  videoWidth: () => number
};

declare type Connection = {
  connectionId: string,
  creationTime: number,
  data: string
}

// const events = {
//   session: [
//     'archiveStarted',
//     'archiveStopped',
//     'connectionCreated',
//     'connectionDestroyed',
//     'sessionConnected',
//     'sessionDisconnected',
//     'sessionReconnected',
//     'sessionReconnecting',
//     'signal',
//     'streamCreated',
//     'streamDestroyed',
//     'streamPropertyChanged',
//   ],
//   core: [
//     'connected',
//     'startScreenShare',
//     'endScreenShare',
//     'error',
//   ],
//   communication: [
//     'startCall',
//     'endCall',
//     'callPropertyChanged',
//     'subscribeToCamera',
//     'subscribeToScreen',
//     'subscribeToSip',
//     'unsubscribeFromCamera',
//     'unsubscribeFromSip',
//     'unsubscribeFromScreen',
//     'startViewingSharedScreen',
//     'endViewingSharedScreen',
//   ],
//   textChat: [
//     'showTextChat',
//     'hideTextChat',
//     'messageSent',
//     'errorSendingMessage',
//     'messageReceived',
//   ],
//   screenSharing: [
//     'startScreenSharing',
//     'endScreenSharing',
//     'screenSharingError',
//   ],
//   annotation: [
//     'startAnnotation',
//     'linkAnnotation',
//     'resizeCanvas',
//     'annotationWindowClosed',
//     'endAnnotation',
//   ],
//   archiving: [
//     'startArchive',
//     'stopArchive',
//     'archiveReady',
//     'archiveError',
//   ],
// };

declare type Stream = {
  connection: Connection,
  creationTime: number,
  frameRate: number,
  hasAudio: boolean,
  hasVideo: boolean,
  name: string,
  videoDimensions: { width: number, height: number },
  videoType: VideoType
}

declare type SignalParams = {
  type: string,
  to?: Connection,
  data?: any // eslint-disable-line flowtype/no-weak-types
};

declare type SignalProps = {
  from: Connection,
  data?: string // eslint-disable-line flowtype/no-weak-types
};

declare type Signal = {
  from: Connection,
  data: void | string,
  type: string
}

declare type CoreMeta = {
  publishers: {
    camera: number,
    screen: number,
    total: number
  },
  subscribers: {
    camera: number,
    screen: number,
    total: number
    }
};

declare type CoreState = {
  meta: CoreMeta,
  streams: { [streamId: string]: Stream},
  streamMap: { [streamId: string]: Subscriber},
  publishers: {
    camera: { [publisherId: string]: Publisher},
    screen: { [publisherId: string]: Publisher}
  },
  subscribers: {
    camera: { [subscriberId: string]: Subscriber},
    screen: { [subscriberId: string]: Subscriber}
  }
}

declare type SubscriberEventData = { subscriber: Subscriber } & CoreState;

declare type StreamEventHandler = OTStreamEvent => void;

declare type OTEventListener = OTEvent => void;
declare type StreamEventListener = (UserRole, StreamEventType, Stream) => void;
declare type StateChangeListener = CoreState => void;
declare type SignalListener = Signal => void;
declare type OTListener = OTEventListener | StreamEventHandler | StateChangeListener | SignalListener;

declare type OTListeners = {
  onStreamChanged: StreamEventListener,
  onStateChanged: StateChangeListener,
  onSignal: SignalListener
};

declare class Core {
  connect: () => Promise<{connections: number}>,
  disconnect: () => Promise<void>,
  endCall: () => void,
  forceDisconnect: (Connection) => Promise<void>,
  forceUnpublish: (Stream) => Promise<void>,
  getAccPack: (string) => Object, // eslint-disable-line flowtype/no-weak-types
  getCredentials: () => SessionCredentials,
  getOptions: () => CoreOptions,
  getPublisherForStream: (Stream) => Object, // eslint-disable-line flowtype/no-weak-types
  getSession: () => Object, // eslint-disable-line flowtype/no-weak-types
  getSubscribersForStream: () => Array<Subscriber>, // eslint-disable-line flowtype/no-weak-types
  off: (string, (event: OTEvent) => void) => void,
  on: (string, OTListener) => void,
  signal: (type: string, data?: any, to?: Object) => Promise<void>, // eslint-disable-line flowtype/no-weak-types
  startCall: () => Promise<CoreState>,
  state: () => CoreState,
  subscribe: (Stream) => Promise<Subscriber>, // eslint-disable-line flowtype/no-weak-types
  toggleLocalAudio: (boolean) => void,
  toggleLocalVideo: (boolean) => void,
  toggleRemoteAudio: (string, boolean) => void,
  toggleRemoteVideo: (string, boolean) => void,
  unsubscribe: (Subscriber) => Promise<void>
}

declare type CoreInstanceListener = Core => void;
declare type OpentokSessionOptions = {
  autoPublish?: boolean
}
declare type CoreInstanceOptions = {
  name: string,
  coreOptions: CoreOptions,
  eventListeners: CoreInstanceListener,
  opentokOptions?: OpentokSessionOptions
};

declare type OpentokConfigOptions = {
  userCredentials: UserCredentials,
  userType: UserRole,
  listeners: OTListeners,
  broadcast?: BroadcastEvent
};

declare type CoreOptions = {
  name?: string,
  credentials: SessionCredentials,
  packages?: Array<string>,
  streamContainers: (PubSub, VideoType, {userType: UserRole}, Stream) => string,
  controlsContainer: null | string
};
