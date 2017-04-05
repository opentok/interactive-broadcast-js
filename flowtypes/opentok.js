// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type PubSub = 'publisher' | 'subscriber';
declare type PubSubSource = 'camera' | 'screen';
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
  streamContainers: (PubSub, PubSubSource, {userType: UserRole}) => string,
  controlsContainer: null | string
};
