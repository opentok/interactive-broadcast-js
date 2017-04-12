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

declare type CoreOptions = {
  credentials: SessionCredentials,
  packages: [string],
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
