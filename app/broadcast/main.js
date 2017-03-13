/** @jsx React.DOM */
/*eslint-env es6 */
var React = require('react');
var _ = require('underscore');
var OnUnload = require("react-window-mixins").OnUnload;

var ReactToastr = require('react-toastr');
var ToastContainer = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);
var classNames = require('classnames');

var BroadcastPlayer = require('./player');

var BroadcastApp = React.createClass({

    getInitialState: function() {
        return {
            broadcastId: '',
            broadcastKey: '',
            broadcastUrl: '',
            broadcastSession: '',
            eventLive: 'false',
            addedToInteractiveQueue: false,
            connectedToWebsocketServer: false,
            eventStatus: 'waiting',
            eventImage: document.getElementById('broadcast_app').getAttribute('event_image')
        }
    },

    componentDidMount: function() {
        var broadcastData = JSON.parse(document.getElementById('broadcast_app').getAttribute('broadcast'));
        this.setState(broadcastData);
        this.openBroadcastPresenceConnection();
        if(broadcastData.eventLive === 'true') this.setState({eventStatus:'playing'});
        if(broadcastData.eventEnded === 'true') this.setState({eventStatus:'ended'});

    },

    setReadyToStream: function () {
        console.log('setting ready to stream');
        var broadcastData = this.state;
        broadcastData.eventLive = 'true';
        this.setState(broadcastData);
    },
    
    componentWillUnmount: function() {
        this.closeWebsocketConnection();
    },
    
    openBroadcastPresenceConnection: function() {
        var _this = this;
        this.io = window.io;
        this.presenceSocket = this.io.connect(document.getElementById('broadcast_app').getAttribute('signaling_url'));
        
        this.presenceSocket.on('serverConnected', function() {
            _this.setState({connectedToWebsocketServer: true});
            _this.presenceSocket.emit('joinBroadcast', 'broadcast' + _this.state.broadcastId); 
        });
        
        this.presenceSocket.on('addedToQueue', function(queueLength){
            console.log('Added to queue.  There are currently ' + queueLength + ' fans in line.');
            _this.setState({addedToInteractiveQueue: true});
        }); 
        
        this.presenceSocket.on('removedFromQueue', function(removed){
            console.log('Removed from queue: ', removed);
            _this.setState({addedToInteractiveQueue: false});
        });
        
        this.presenceSocket.on('moveToInteractive', function(token) {
            var current = window.location.href;
            window.location = current + '?t=' + token;
        });
        
        this.presenceSocket.on('eventEnded', function() {
            var broadcastData = _this.state;
            // Due to the delay, we can wait ~20 seconds to stop the video
            setTimeout(function(){
                broadcastData.eventLive = 'false';
                broadcastData.eventStatus = 'ended';
                _this.setState(broadcastData);
            }, 1000 * 20);
        });

        this.presenceSocket.on('eventGoLive', function() {
            setTimeout(function(){
                _this.setReadyToStream();
                _this.setState({eventStatus:'playing'});
            }, 1000 * 15);
        });
        
    },
    
    closeBroadcastPresenceConnection: function() {
        this.presenceSocket && this.presenceSocket.disconnect();
        this.presenceSocket = null;
    },

    onPlay: function() {
        this.setState({eventStatus:'playing'});
    },
    
    toggleInteractiveQueue: function() {
        var _this = this;
        var action = [this.state.addedToInteractiveQueue ? 'leave' : 'join', 'InteractiveQueue'].join('');
        this.presenceSocket.emit(action, this.state.broadcastSession);
    },

    render: function() {
        
        var eventStatusClass = classNames({
            'btn fan-status stat-red': true,
            'btn-broadcast-waiting': this.state.eventStatus === 'waiting',
            'btn-broadcast-ended': this.state.eventStatus === 'ended',
            'hidden': this.state.eventStatus === 'playing'
        });
        
        var eventStatus = this.state.eventStatus === 'waiting' ? 'Waiting to begin' : 'This event is over'; 
        var eventImage = this.state.eventImage;
        return ( 
            <div className="panel-body">
                <BroadcastPlayer broadcast={this.state} onPlay={this.onPlay} eventImage={eventImage}/>
                <button className={eventStatusClass}>{eventStatus}</button>
            </div>
        );

    }
});
 
module.exports = BroadcastApp;