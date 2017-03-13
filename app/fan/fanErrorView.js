/** @jsx React.DOM */
var React       = require('react');
var _           = require('underscore');
var $           = require('jquery');

'use strict';

var FanErrorView = React.createClass({
  getInitialState: function() {
    return {
      
    };
  },

  componentDidMount: function () {
    swal({
        title: ["<div style='color: #3dbfd9; font-size:22px'>This show is over the maximum number of participants.</div>"].join(''),
        text: "<h4 style='font-size:1.2em'>Please try again in a few minutes.</h4>",
        html: true,
        timer: 999999,
        showConfirmButton: false
      });  
  },

  render: function() {
    var event_name = this.props.event_name;
    var event_image = (this.props.event_image) ? this.props.event_image : '/img/TAB_VIDEO_PREVIEW_LS.jpg';
    return (
      <div className="content fan_view no-header">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1">
              <div className="panel panel-default fan-live-panel">
                <div className="panel-title">
                  <h4>
                    <span>{event_name}</span>
                  </h4>
                </div>
                <div className="panel-body">
                  <div className="preshow-image-window">
                    <img id="event-image" className="preshow-image" src={event_image}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>  
      </div>
    );
  }
});

module.exports = FanErrorView;
