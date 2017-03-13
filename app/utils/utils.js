var Utils = {
  jsonParse: function(data) {
      return typeof data === 'string' ? JSON.parse(data) : data;
  },
};

module.exports = Utils;
