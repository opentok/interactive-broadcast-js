// @flow
import otCore from 'opentok-accelerator-core';

let otSDK;

const coreOptions = (credentials: SessionCredentials): CoreOptions => ({
  credentials,
  packages: ['textChat'],
  streamContainers: (pubSub: PubSub, source: PubSubSource, { userType }: { userType: UserRole }): string => `#video${userType}`,
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
    otCore.init(coreOptions(stageCredentials));
    otSDK = new otCore.OpenTokSDK(backstageCredentials);
    await Promise.all([otCore.connect(), otSDK.connect()]);
    return;
  } catch (error) {
    throw error;
  }
};

const disconnect: Unit = () => {
  try {
    otCore.disconnect();
    otSDK.disconnect();
  } catch (error) {
    console.log('ok');
  }
};


module.exports = {
  connect,
  disconnect,
};
