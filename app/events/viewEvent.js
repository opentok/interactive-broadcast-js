/** @jsx React.DOM */
var React  = require('react');
var VideoPlayer = require('../common/videoPlayer');

var ViewEvent = React.createClass({
  getInitialState: function () {
    return {
      eventData: this.props.eventData
    };
  },

  render: function () {
    var _this = this;

    var videoPlayerView = React.createElement(VideoPlayer, {
      src: _this.state.eventData.archive_url,
      poster: _this.state.eventData.event_image || "/img/TAB_VIDEO_PREVIEW_LS.jpg"
    });

    return React.createElement('div', {className: 'eventVideoPlayer'}, [videoPlayerView]);
  }
});

module.exports = ViewEvent;