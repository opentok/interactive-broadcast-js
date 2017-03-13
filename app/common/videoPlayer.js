/** @jsx React.DOM */
var React = require('react');

var VideoPlayer = React.createClass({

  // add more functionality here if needed

  render: function () {

    return React.createElement('video', {
      src: this.props.src,
      poster: this.props.poster,
      preload: 'metadata',
      controls: true
    });

  }

});

module.exports = VideoPlayer;
