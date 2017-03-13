/** @jsx React.DOM */
var React       = require('react');
var _           = require('underscore');
var $           = require('jquery');

'use strict';

var eventEndedOverlay = React.createClass({

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
  },

  componentWillUnmount: function() {
  },

  render: function() {
    return (
      <div id='eventEndedOverlay' className='overlay dimmer'>
        <span className="brand hide"></span>
        <div className='header'>
          <h1 className='lightBlue'>Show Ended!</h1>
        </div>

        <div className='body'>
          <h5>The party is over!</h5>
        </div>
      </div>
    );
  }
});

module.exports = eventEndedOverlay;