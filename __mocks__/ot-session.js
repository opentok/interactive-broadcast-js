var data = require.requireActual("./mocked-data");

function Session(apiKey, sessionId) {
  this.apiKey = apiKey;
  this.sessionId = sessionId;
  this.on = function() { console.log(arguments); };
  this.testNetwork = function(session, publisher, callback) { callback(null, data.testNetworkData) };
  this.connect = function() {};
}

module.exports = Session;
