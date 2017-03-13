var helper = require('./utils/firefoxHelper.js');
var config = require('./base.conf');

config.getMultiCapabilities = helper.ffProfile;

if (process.env.TRAVIS_BUILD_NUMBER) {
  config.sauceUser = process.env.SAUCE_USERNAME;
  config.sauceKey = process.env.SAUCE_ACCESS_KEY;
  config.capabilities = {
    'browserName': 'internet explorer',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    'build': process.env.TRAVIS_BUILD_NUMBER,
    'platform': 'ANY',
    'version': '11',
    'name': 'E2E On IE'
  };
}

exports.config = config;