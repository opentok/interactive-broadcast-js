/** @jsx React.DOM */
var React       = require('react');
var _           = require('underscore');
var $           = require('jquery');

'use strict';

var Wrapper = React.createClass({

  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
  },

  componentWillUnmount: function() {
  },

  render: function() {
    return (<div>{this.props.children}</div>);
  }
});

module.exports = Wrapper;
