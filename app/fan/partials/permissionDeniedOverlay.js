/** @jsx React.DOM */
var React       = require('react');
var _           = require('underscore');
var $           = require('jquery');

'use strict';

var PermissionDeniedOverlay = React.createClass({

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
  },

  componentWillUnmount: function() {
  },

  render: function() {
    return (
      <div id='permissionDenied' className='overlay dimmer'>
        <span className="brand hide"></span>
        <div className='header'>
          <h1 className='huge'>:(</h1>
          <h1 className='lightRed'>Aw, what happened?</h1>
        </div>
        <div className='body'>
          <h5>Please allow access to your camera <br/> and microphone to continue.</h5>
          <h5>Click the camera icon in your browser bar <br/> to view the permissions dialog.</h5>
        </div>
      </div>
    );
  }
});

module.exports = PermissionDeniedOverlay;
