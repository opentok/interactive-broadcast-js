module.exports = {
  allScriptsTimeout: 10000,

  specs: ['e2e/*.js'],

  baseUrl: 'http://localhost:3000',

  framework: 'jasmine',

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 60000,
    isVerbose: true,
    showTiming: true,
    includeStackTrace: true
  },

  onPrepare: function() {
    browser.manage().window().setSize(1600, 1000);
    browser.ignoreSynchronization = true;
    require('./utils/waitReady.js');
    require('./utils/hasClass.js');
  }
};