var config = require('./base.conf');

config.capabilities = {
  browserName: 'chrome',
  chromeOptions: {
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-translate',
      ' --no-sandbox',
      '--use-fake-ui-for-media-stream', // Prevent the Allow|Deny prompt for media.
      '--use-fake-device-for-media-stream' // Use fake device so it works on CI server.
    ]
  }
};

if (process.env.TRAVIS_BUILD_NUMBER) {
  config.sauceUser = process.env.SAUCE_USERNAME;
  config.sauceKey = process.env.SAUCE_ACCESS_KEY;
  config.capabilities = {
    'browserName': 'chrome',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    'build': process.env.TRAVIS_BUILD_NUMBER,
    'name': 'E2E On Chrome'
  };
}

exports.config = config;