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

declare type Subscriber = {
  element: Element,
  id: string,
  stream: Stream,
  getAudioVolume: () => number,
  getImgData: () => string,
  getStats: () => Object, // eslint-disable-line flowtype/no-weak-types
  getStyle: () => Object, // eslint-disable-line flowtype/no-weak-types
  off: (string, OTEvent => void, Object) => Object, // eslint-disable-line flowtype/no-weak-types
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
  off: (string, OTEvent => void) => void,
  on: (string, OTEvent => void) => void,
  signal: (string, *, Connection) => Promise<void>,
  startCall: () => Promise<CoreState>,
  state: () => CoreState,
  subscribe: (Stream) => Promise<Subscriber>, // eslint-disable-line flowtype/no-weak-types
  toggleLocalAudio: (boolean) => void,
  toggleLocalVideo: (boolean) => void,
  toggleRemoteAudio: (string, boolean) => void,
  toggleRemoteVideo: (string, boolean) => void,
  unsubscribe: (Subscriber) => Promise<void>
}

declare type CoreOptions = {
  credentials: SessionCredentials,
  packages?: [string],
  streamContainers: (PubSub, VideoType, {userType: UserRole}, Stream) => string,
  controlsContainer: null | string
};

declare type Connection = {
  connectionId: string,
  creationTime: number,
  data: string
}

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

declare type OTEvent = {
 cancelable: boolean,
 target: Object, // eslint-disable-line flowtype/no-weak-types
 type: string,
 isDefaultPrevented: () => boolean,
 preventDefault: Unit
}

declare type OTStreamEvent = { stream: Stream } & OTEvent;

type SignalProps = {
  from?: Connection,
  to?: Connection,
  data?: string
};

declare type Signal = OTEvent & SignalProps;

declare type CoreState = {
  meta: {
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
  },
  streams: { [streamId: string]: Stream},
  streamMap: { [streamId: string]: string},
  publishers: {
    camera: { [publisherId: string]: Object}, // eslint-disable-line flowtype/no-weak-types
    screen: { [publisherId: string]: Object} // eslint-disable-line flowtype/no-weak-types
  },
  subscribers: {
    camera: { [subscriberId: string]: Object}, // eslint-disable-line flowtype/no-weak-types
    screen: { [subscriberId: string]: Object} // eslint-disable-line flowtype/no-weak-types
  }
}

declare type SubsrcriberEventData = { subscriber: Subscriber } & CoreState;
