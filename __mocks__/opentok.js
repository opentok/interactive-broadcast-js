var Session = require.requireActual("./ot-session");
var Publisher = require.requireActual("./ot-publisher");

module.exports = {
    initSession: function(apiKey, sessionId) {
        return new Session(apiKey, sessionId);
    },
    initPublisher: function() {
        return new Publisher();
    }
};
