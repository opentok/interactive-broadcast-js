// @flow
import OTKAnalytics from 'opentok-solutions-logging';
var pjson = require('../../package.json');

/** Analytics */
const logVariation = {
  attempt: 'Attempt',
  success: 'Success',
  fail: 'Fail',
};

const logAction = {
  // vars for the analytics logs. Internal use
  init: 'Init',
  celebrityAcceptsCameraPermissions: 'CelebrityAcceptsCameraPermissions',
  celebrityConnects: 'CelebrityConnects',
  celebrityPublishes: 'CelebrityPublishes',
  celebritySubscribesToFan: 'CelebritySubscribesToFan',
  celebritySubscribesToHost: 'CelebritySubscribesToHost',
  fanConnectsOnstage: 'FanConnectsOnstage',
  fanConnectsBackstage: 'FanConnectsBackstage',
  fanPublishesBackstage: 'FanPublishesBackstage',
  hostConnects: 'HostConnects',
  hostAcceptsCameraPermissions: 'HostAcceptsCameraPermissions',
  hostPublishes: 'HostPublishes',
  hostSubscribesToFan: 'HostSubscribesToFan',
  hostSubscribesToCelebrity: 'HostSubscribesToCelebrity',
  producerConnects: 'ProducerConnects',
  producerMovesFanOnstage: 'ProducerMovesFanOnstage',
  producerGoLive: 'ProducerGoLive',
  producerEndShow: 'ProducerEndShow',
};

class Analytics {

  constructor(source, sessionId, connectionId, apikey) {
    const otkanalyticsData = {
      clientVersion: 'js-ib-' + pjson.version,
      source,
      componentId: 'iBS',
      name: 'guidIB',
      partnerId: apikey,
    };

    this.analytics = new OTKAnalytics(otkanalyticsData);

    if (connectionId) {
      this.update(sessionId, connectionId, apikey);
    }
  }

  update = (sessionId, connectionId, apiKey) => {
    if (sessionId && connectionId && apiKey) {
      const sessionInfo = {
        sessionId,
        connectionId,
        partnerId: apiKey,
      };
      this.analytics.addSessionInfo(sessionInfo);
    }
  };

  log = (action, variation) => {
    this.analytics.logEvent({ action, variation });
  };
}

module.exports = {
  Analytics,
  logVariation,
  logAction,
};
