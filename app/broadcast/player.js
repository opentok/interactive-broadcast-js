/** @jsx React.DOM */
var React = require('react');
var _ = require('underscore');


var BroadcastPlayer = React.createClass({
    
    getInitialState : function() {
        return {
            queued: false
        }
    },

    componentDidMount: function () {
        if(this.props.broadcast.eventLive == 'true' && this.props.broadcast.eventEnded !== 'true') { 
            this.start();
        }
    },
    
    componentWillReceiveProps: function(props) {
        if ( props.broadcast.eventStatus == 'ended' ) {
            this.stop();
            return;
        }

        if ( props.broadcast.eventLive == 'true' && props.broadcast.eventEnded !== 'true' ) {
            this.start();
            return;
        }
    },

    start: function () {
        var _this = this;
        setTimeout(function() {
            var broadcastUrl = _this.props.broadcast.broadcastUrl;
            flowplayer('#hlsjslive', {
                splash: false,
                embed: false,
                ratio: 9 / 16,
                autoplay: true,
                clip: {
                    autoplay: true,
                    live: true,
                    sources: [{
                            type: 'application/x-mpegurl',
                            src: broadcastUrl
                        }]
                        
                }
            })
        }, 200);
        
    },
    
    stop : function() {
      
    },

    render: function() {
        var eventImage = this.props.eventImage !== '' ? this.props.eventImage  : '/img/TAB_VIDEO_PREVIEW_LS.jpg';
        if(this.props.broadcast.eventLive === 'true' && this.props.broadcast.eventEnded !== 'true' ) {
            return ( 
              <div id="hlsjslive"></div>
            );    
        } else {
            return ( 
              <video id="video" className="broadcast-player" poster={eventImage}></video>
            );    
        }
        

    }
});

module.exports = BroadcastPlayer;