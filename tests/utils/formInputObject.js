var _ = require('underscore');

module.exports = {
  clear: function (element) {
    return element.getAttribute('value').then(function (text) {
      var len = text.length
      var backspaceSeries = Array(len+1).join(protractor.Key.BACK_SPACE);
      return element.sendKeys(backspaceSeries);
    });
  }
};