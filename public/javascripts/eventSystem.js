var EventSystem = (function () {
  var _this = this;
  _this.queue = {};

  return {
    send: function (event, data) {
      var queue = _this.queue[event];

      if (typeof queue === 'undefined') {
        return false;
      }

      jQuery.each(queue, function (key, method) {
        (method)(data);
      });

      return true;
    },

    on: function (event, callback) {
      if (typeof _this.queue[event] === 'undefined') {
        _this.queue[event] = [];
      }

      _this.queue[event].push(callback);
    }
  };
}());