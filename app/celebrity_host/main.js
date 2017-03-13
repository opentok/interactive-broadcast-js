/** @jsx React.DOM */
var React = require("react");
var CelebrityHostView = require("./celebrityHostView");

var CelebrityHostApp = React.createClass({
  render: function() {
    var url = this.props.elem.getAttribute("url");
    var _boxId = this.props.elem.getAttribute("box-id");
    var base_url = '';
    if(_boxId == 'celebrityBox') {
        base_url = '/celebrity/create_service/';
    } else {
		base_url = '/host/create_service/';
    }
    return (React.createElement(CelebrityHostView, { boxId: _boxId,  source: [base_url, url].join('') }));
  }
});

module.exports = CelebrityHostApp;
