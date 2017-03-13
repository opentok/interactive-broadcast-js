var expressSession = require('express-session');
var RedisStore = require('connect-redis')(expressSession);
var config = require('./libs/config');

module.exports = function Sessions() {
  var store = new RedisStore({
    url: config.get('REDISCLOUD_URL') || config.get('REDIS_URL')
  });
  var session = expressSession({
    secret: config.get('SECRET_KEY'),
    store: store,
    resave: true,
    saveUninitialized: true
  });

  return session;
};