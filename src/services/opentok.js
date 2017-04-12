// @flow
import Core from 'opentok-accelerator-core';

let coreStage;
let coreBackstage;

const coreOptions = (credentials: SessionCredentials, publisherRole: UserRole): CoreOptions => ({
  credentials,
  packages: ['textChat'],
  streamContainers(pubSub: PubSub, source: VideoType, data: { userType: UserRole }, stream: Stream): string {
    return `#video${pubSub === 'subscriber' ? data.userType : publisherRole}`;
  },
  controlsContainer: null,
});

const connect = async ({ apiKey, backstageToken, stageToken, event }: ProducerCredentials): AsyncVoid => {
  const stageCredentials = {
    apiKey,
    sessionId: event.stageSessionId,
    token: stageToken,
  };
  const backstageCredentials = {
    apiKey,
    sessionId: event.sessionId,
    token: backstageToken,
  };
  try {
    // Core and SDK Wrapper should have 'connected' properties returned by state
    // They should also wrap disconnect in try/catch in case a user tries to disconnect before connecting
    coreStage = new Core(coreOptions(stageCredentials));
    coreBackstage = new Core(coreOptions(backstageCredentials));
    await Promise.all([coreStage.connect(), coreBackstage.connect()]);
    return;
  } catch (error) {
    throw error;
  }
};

const connectCelebHost = async ({ apiKey, stageSessionId, stageToken, userType }: CelebHostCredentials): AsyncVoid => {
  const stageCredentials = {
    apiKey,
    sessionId: stageSessionId,
    token: stageToken,
  };

  try {
    coreStage = new Core(coreOptions(stageCredentials, userType));
    await coreStage.connect();
    await coreStage.startCall();
>>>>>>> ee128fe2bb89b895b8daa151781b89f4426b040a
    return;
  } catch (error) {
    throw error;
  }
};

const disconnect: Unit = () => {
  try {
    coreStage.disconnect();
    coreBackstage.disconnect();
  } catch (error) {
    console.log('ok');
  }
};

module.exports = {
  connect,
  disconnect,
  connectCelebHost,
};
