var React       = require('react');
var _           = require('underscore');
var camelize = require("underscore.string/camelize");
var Dash        = require('./partials/dash');
var UserList    = require('./partials/user_list');
var ChatFooter  = require('./partials/user_chat');
var blockProducerView = require('./partials/block_producer_view');
var AjaxHandler = require('../common/ajax-handler');
var LostConnectionWarning = require('../common/lostConnectionWarning');
var OnUnload    = require("react-window-mixins").OnUnload;
var Analytics   = require('opentok-solutions-logging');
var moment   = require('moment');
var utils   = require('../utils/utils');

var OTKVariation = {
  SUCCESS:"Success",
  ATTEMPT:"Attempt",
  FAILURE:"Fail"
};

var ShowContainer = React.createClass({
    mixins: [ OnUnload ],

    getInitialState: function(){
      return {
          recordingStopped: false,
          finishSignalSent: false,
          data: {},
          event: {},
          users:[],
          streams:[],
          feeds:this.initUserFeeds(),
          userInCall: null,
          users_count:0,
          userInCallSubscriber: null,
          connectedTo: {signal: false, backstage: false, onstage: false},
          doNotConnect: false,
          nextFanConnection:null,
          accessAllowedCount: 0,
          accessDenied: false,
          streamUIOptions: {
            frameRate: 15,
            height: "100%",
            insertMode: "append",
            showControls:true,
            width: "100%",
          }
      };
    },

    initUserFeeds: function(){
        var _this = this;
        var types = ['backstage_fan', 'fan', 'host', 'celebrity'];
        var boxes = {};
        _.each(types,function(t){
            boxes[t] = {
                type : t,
                quality : null,
                stream : null,
                onBackStage : false,
                mute: false,
                videoMuted: false,
                audioVolume: 100,
                inCall: false
            };
        });
        return boxes;
    },
    componentDidMount: function(){
        var _event_id = this.props.elem.getAttribute("event");
        this.lostConnectionWarning  = new LostConnectionWarning()
        this.ajaxHandler = new AjaxHandler();
        this.ajaxHandler.postRequest(
            "/admin/event_get",
            {id:_event_id},
            this.onEventDataReceived,
            this.onAjaxRequestError
        );
        OT.on('exception', this.onOTException);
    },

    componentWillUnmount: function() {
      this.disconnectSocket();
    },

    disconnectSocket: function () {
      this.socket && this.socket.disconnect();
    },

    onBeforeUnload: function() {
      this.state.backstageSession.signal({ type: 'producerLeaving' });
    },

    startWebsocketConnection: function() {
      var _this = this;
      var event = this.state.event;
      var data = this.state.data;
      this.io = window.io;
      this.socket = this.io.connect(event.signaling_url);
      this.socket.on('serverConnected', function() {
            _this.setState({connectedTo: _.extend(_this.state.connectedTo, { signal: true }) });
      });
      this.socket.on('broadcastURL', function(url) {
        _this.setState({event: _.extend(event, { broadcastURL: url }) });
      });

      //Snapshot
      this.socket.emit('joinRoom', data.sessionId);
      this.socket.on('userSnapshot', this.userSnapshotReceived);

      //Producer blocker flow
      this.socket.emit('newProducer', {token: data.tokenHost, eventId: event.id});
      this.socket.on('newProducer', this.validateProducer);
      this.socket.on('blockProducer', this.blockProducer);
      this.socket.on('updateInteractiveUsers', this.updateInteractiveUsers);
    },

    updateInteractiveUsers: function (users) {
      this.refs.dashboard.updateInteractiveUsers(users);
    },

    startLoggingEngine:function(){
      var event = this.state.event;
      var _otkanalyticsData = {
        sessionId: this.state.data.sessionIdHost,
        partnerId: this.state.data.apiKey,
        source:window.location.href,
        clientVersion: 'js-ib-1.0.6',
        name: 'guidIB',
        componentId:"iBS"};
      this.OTKlogging = new Analytics(_otkanalyticsData);
    },

    logEvent: function(action, variation) {
      if(this.OTKlogging) this.OTKlogging.logEvent({ action: camelize("_"+action), variation: variation });
    },

    blockMe: function() {
      this.setState({doNotConnect:true});
      this.disconnectSocket();
      if(this.state.backstageSession) {
        this.cleanUpSession(this.state.backstageSession, this.producerPublisher);
      }
      if(this.state.onstageSession) {
        this.cleanUpSession(this.state.onstageSession, this.producerPublisher);
      }
    },

    blockProducer: function(data) {
      if(!data) return;
      if(data.token === this.state.data.tokenHost && data.eventId === this.state.event.id) {
        this.blockMe();
      }
    },

    validateProducer: function(data) {
      if(!data) return;
      if(data.token !== this.state.data.tokenHost && data.eventId === this.state.event.id) {
        this.socket.emit('blockProducer', data);
      }
    },

    getSession: function() {
        this.ajaxHandler = new AjaxHandler();
        this.ajaxHandler.getRequest(
            ['/admin/create_service/', this.props.elem.getAttribute("event")].join(''),
            this.onSessionDataReceived,
            this.onAjaxRequestError
        );
    },

    connectFanWithHost: function () {
        var feeds = this.state.feeds;
        var _users = this.state.users;
        var connectSignal = {
            to: feeds["backstage_fan"].stream.connection,
            type: 'joinHost'
        };
        this.state.backstageSession.signal(connectSignal, this.onSignalCompleted);

        this.lastUserConnectionIdBackstage = feeds["backstage_fan"].stream.connection.connectionId;
        var index = this.findUserByConnectionId(feeds["backstage_fan"].stream.connection.connectionId);
        if(_users[index]) {
            _users[index].connectedToHost = true;
            _users[index].backstageConnected = false;
            this.setState({users: _users});
            this.changeFeedCountback("fan",true,feeds["backstage_fan"].stream.connection);
        }
    },
    sendConnectNowSignal:function(){
        var _this = this;
        var connectSignal = {
            to: this.state.nextFanConnection,
            type: 'joinHostNow'
        };
        this.state.backstageSession.signal(connectSignal,function(error){
            if (error) {
                console.log('ERROR', error);
                _this.logEvent('producer_move_fan_to_feed', OTKVariation.FAILURE);
            } else {
                _this.logEvent('producer_move_fan_to_feed', OTKVariation.SUCCESS);
            }
        });
    },
    sendStartEventSignal: function () {
        var starEventSignal = {
            type: 'startEvent'
        };
        this.state.onstageSession.signal(starEventSignal, this.onSignalCompleted);
    },

    onSignalCompleted: function (error) {
        if (error) {
            console.log('ERROR', error);
        }
    },

    onSendGoLiveSignal: function (error) {
        if (error) {
            console.log('ERROR', error);
            this.logEvent('producer_go_live', OTKVariation.FAILURE);
        } else {
            this.logEvent('producer_go_live', OTKVariation.SUCCESS);
        }
    },

    onSendFinishEventSignalCompleted: function (error) {
      if (error) {
        console.log('onSendFinishEventSignalCompleted', error);
        this.logEvent('producer_ends_show', OTKVariation.FAILURE);
      } else {
        this.setState({finishSignalSent:true});
        this.logEvent('producer_ends_show', OTKVariation.SUCCESS);
      }
      this.stopRecording();
    },

    moveToFan: function (quality){
        this.logEvent('producer_move_fan_to_feed', OTKVariation.ATTEMPT);
        var feeds = this.state.feeds;

        if (feeds['fan'].stream !== null) {
            var disconnectSignal = {
                to: feeds['fan'].stream.connection,
                type: 'disconnect'
            };
            this.state.onstageSession.signal(disconnectSignal);
            feeds['fan'].stream = null;
            this.setState({feeds:feeds});
        }
        if (feeds['backstage_fan'].stream !== null) {
            feeds['fan'].quality = quality;
            feeds['fan'].videoMuted = false;
            feeds['fan'].mute = false;
            feeds['fan'].audioVolume = 100;
            this.setState({feeds:feeds});
            this.connectFanWithHost();

        }

        try{
            var connectionId = feeds['backstage_fan'].stream.connection.connectionId;
            EventSystem.send('user.requestStageStatus.' + connectionId);
        } catch (err) {}
    },

    updateEventStatus: function (status, callback) {
      var _this = this;
      $.post(
        "/admin/change-event-status",
        {id: _this.state.event.id, newStatus: status},
        function (result) {
          if(result.error){
            _this.displayApiKeyError();
          }else{
            var updatedEvent = _this.state.event;
            updatedEvent['status'] = status;
            if(status==='L') {
              updatedEvent['show_started'] = moment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
            }
            
            //Send socket message
            _this.socket.emit('changeStatus', {id: _this.state.event.id, newStatus: status});

            // update event state
            _this.setState({
              event: updatedEvent
            });

            if (typeof(callback) === 'function') callback();
          }
      });
    },

    eventGoLive: function () {
      var _this = this;
      this.logEvent('producer_go_live', OTKVariation.ATTEMPT);
      this.checkAndDisconnectPrivateCall();
      this.stopPublishingOnStage();
      //Update the event status on DB
      this.updateEventStatus('L',function(){
        //Send the Go Live signal through tokbox
        _this.sendGoLiveSignal();
        //If broadcast is enabled, send the Go Live signal through the signaling server
        if(_this.socket && _this.isBroadcastEnabled()) _this.socket.emit('eventGoLive', _this.state.data.sessionIdHost);
        //Start the archiving
        _this.startRecording();
      });
    },

    endEventShow: function () {
      this.logEvent('producer_ends_show', OTKVariation.ATTEMPT);
      this.updateEventStatus('C', this.sendFinishEventSignal);
      this.refs.dashboard.clearElapsedTimeInterval();
    },

    redirectToEventLists: function() {
      var _this = this;
      setTimeout(function(){
        if(_this.state.stopRecording && _this.state.event.status == 'C' && _this.state.finishSignalSent) {
            var _event = _this.state.event;
            if (_event.archive_event) {
                window.location = '/admin/#archived';
            } else {
                window.location = '/admin';
            }
        } else {
            _this.redirectToEventLists();
        }
      }, 1000);

    },

    startRecording: function() {
      var _this = this;
      var _event = this.state.event;

      if (_event.archive_event) {
        var startArchiveUrl = [
          '/admin/archive/start/', this.state.onstageSession.sessionId, '/', _event.id, '/', _event.composed
        ].join('');

        $.get(startArchiveUrl, function (result) {
          // set archive Id. TODO: store it in DB
          _event['archive_id'] = result.id;
          _this.setState({event: _event});
        });
      }
    },

    stopRecording: function() {
      var _event = this.state.event;
      var _this = this;
      if (_event.archive_id) {
        var stopArchiveUrl = ['/admin/archive/stop/', _event.archive_id].join('');
        $.get(stopArchiveUrl, function (result) {
          _this.setState({stopRecording:true});
          _this.redirectToEventLists();
        });
      } else {
        _this.setState({stopRecording:true});
        _this.redirectToEventLists();
      }
    },
    sendGoLiveSignal: function() {
      var disconnectSignal = {
        type: 'goLive'
      };
      this.state.onstageSession.signal(disconnectSignal, this.onSendGoLiveSignal);
    },

    sendFinishEventSignal: function() {
      var disconnectSignal = {
        type: 'finishEvent'
      };
      this.state.onstageSession.signal(disconnectSignal, this.onSendFinishEventSignalCompleted);
      var data = {broadcastSession: this.state.data.sessionIdHost,
                  broadcastEnabled: this.isBroadcastEnabled()};
      if(this.socket) this.socket.emit('eventEnded', data);
    },

    onEventDataReceived: function(results) {
      this.setState({ event: results[0] });
      this.getSession();
    },

    startBackstageSession: function() {
      if(this.state.doNotConnect) return;
      var data = this.state.data;
      //OT.properties.apiUrl = OT.properties.apiURLSSL = "https://anvil-preview.tokbox.com";
      this.setState({backstageSession:this.props.OT.initSession(data.apiKey, data.sessionId)});
      this.state.backstageSession.on('streamCreated', this.onStreamCreated);
      this.state.backstageSession.on('streamDestroyed', this.onStreamDestroyed);
      this.state.backstageSession.on('connectionDestroyed', this.onConnectionDestroyed);
      this.state.backstageSession.on('streamPropertyChanged', this.onStreamPropertyChanged);
      this.state.backstageSession.on('signal:newFan', this.onNewFanAppeared);
      this.state.backstageSession.on('signal:warning', this.onWarningSignalReceived);
      this.state.backstageSession.on('signal:chatMessage', this.onMessageReceived);
      this.state.backstageSession.on('signal:changeVolumen', this.onChangeVolumen);
      this.state.backstageSession.on('signal:qualityUpdate', this.userUpdateQuality);
      this.state.backstageSession.connect(data.token, this.onSessionConnected);
    },

    startOnstageSession: function() {
      if(this.state.doNotConnect) return;
      var data = this.state.data;
      //OT.properties.apiUrl = OT.properties.apiURLSSL = "https://anvil-preview.tokbox.com";
      this.setState({onstageSession: this.props.OT.initSession(data.apiKey, data.sessionIdHost)});
      this.state.onstageSession.on('streamCreated', this.onStageSessionStreamCreated);
      this.state.onstageSession.on('streamDestroyed', this.onStageSessionStreamDestroyed);
      this.state.onstageSession.on('archiveStarted', this.onArchiveStarted);
      this.state.onstageSession.on('archiveStopped', this.onArchiveStopped);
      this.state.onstageSession.on('signal:changeVolumen', this.onChangeVolumen);
      this.state.onstageSession.on('signal:chatMessage', this.onMessageReceived);
      this.state.onstageSession.on('signal:startCoundown', this.startCountdown); //?
      this.state.onstageSession.connect(data.tokenHost, this.onOnstageSessionConnected);
    },

    onChangeVolumen: function (event) {
      if (event.from && (event.from.data === 'usertype=producer')) {
        var data = utils.jsonParse(event.data);
        var feeds = this.state.feeds;
        if(feeds[data.feedType].stream !== null) {
            var session = feeds[data.feedType].onBackStage ?  this.state.backstageSession : this.state.onstageSession;
            feeds[data.feedType].subscriber.setAudioVolume(data.audioVolume);
        }
      } else {
        console.log('Got a signal from an unexpected origin. Ignoring');
      }
    },
    muteOnstageFeeds:function(mute,except){
        var without = except || null;
        var vol = mute? 0 : 100;
        var feeds = this.state.feeds;
        if(without && feeds[without]){
            feeds[without].inCall = mute;
        }
        _.each(feeds,function(feed){
           if(!without || (without && feeds[without] != feed)){
               // Temporary commented this line
               //if(feed.subscriber && feed.session){
               if(feed.stream && feed.subscriber){
                   feed.subscriber.setAudioVolume(vol);
                   feed.inCall = false;
               }
           }

        });
        this.setState({"feeds":feeds});
    },

    connectionDropped: function (){
      this.lostConnectionWarning.show();
    },

    onOTException: function(evt) {
      if(evt.code == 1553 || evt.code == 1554 || evt.code == 1006) {
        this.connectionDropped();
      }
    },

    onSessionDataReceived: function(results) {
        var results = JSON.parse(results);
        var _this = this;
        if (this.isMounted()) {
            this.setState({ data: _.defaults(this.state.data,results) });
            this.startWebsocketConnection();
            setTimeout(function(){
              _this.startOnstageSession();
              _this.startBackstageSession();
            }, 2000);
        }
    },
    onMessageReceived: function(event) {
        if (event.from && (event.from.data === 'usertype=host' ||
        event.from.data === 'usertype=celebrity' || event.from.data === 'usertype=fan')) {
          var _data = utils.jsonParse(event.data);
          _data.message.to = { connectionId : event.from.connectionId};
          var message = {
              data: { message: _data.message },
          };
          this.openChatWindow(event.from.connectionId);
          this.addMessageToChat(event.from.connectionId, message);
        } else {
          console.log('Got a signal from an unexpected origin. Ignoring');
        }
    },

    openChatWindow: function (connectionId) {
      var _user =  this.getUserByConnectionId(connectionId);
      if(_user) {
        if(!_user.chat.chatting) {
          _user.chat.chatting = true;
          _user.chat.last_active = new Date();
          this.changeUserState(connectionId,_user);
        }
      }

    },

    userSnapshotReceived: function(data) {
      if (!data) return;
      var users = this.state.users;
      var index = this.findUserByConnectionId(data.connectionId);
      var user = users[index];
      if(typeof(index) !== 'undefined') {
        user.snapshot = data.snapshot;
        this.setState({ users: users });
      }
    },

    userUpdateQuality: function(event) {
      if (event.from && (event.from.data === 'usertype=host' ||
        event.from.data === 'usertype=celebrity' || event.from.data === 'usertype=fan')) {
        var data = utils.jsonParse(event.data);
        if(!data.connectionId && data.data.connectionId){
          data = data.data
        }
        var users = this.state.users;
        var index = this.findUserByConnectionId(data.connectionId);
        var user = users[index];
        var feeds = this.state.feeds;
        if(typeof(index) !== 'undefined') {
          user.user.quality = data.quality;
          if(data.connectionId === this.lastUserConnectionIdBackstage) {
            feeds['fan'].quality = { label:data.quality,
                                   className: 'user-status ' + data.quality.toLowerCase()};
          }
          this.setState({ users: users, feeds: feeds });
        }
      } else {
        console.log('Got a signal from an unexpected origin. Ignoring');
      }
    },

    checkPrivateCall: function (DisconnectedFeed) {
       var feed_in_call =  this.feedInPrivateCall();
        if(!_.isEmpty(feed_in_call)){
            if(DisconnectedFeed.stream.connection.connectionId === feed_in_call[0].stream.connection.connectionId) {
              this.disconnectFeedFromPrivateCall(feed_in_call[0]);
              this.refs.dashboard.setInCallStatus({ inCall: null, with:null });
            }
        }
    },

    cleanUpSession: function(session, publisher) {
      if (session) {
        if (publisher) {
          session.unpublish(publisher);
        }
        session.off();
        session.disconnect();
      }
    },

    onStageSessionStreamDestroyed: function(event) {
        if(event.stream.connection.data === 'usertype=producer') return;
        var _feeds = this.state.feeds;
        var f_type = "";
        switch(event.stream.connection.data) {
            case 'usertype=fan':
                f_type = 'fan';
                break;
            case 'usertype=host':
                f_type = 'host';
                break;
            case 'usertype=celebrity':
                f_type = 'celebrity';
                break;
        }
        if (_feeds[f_type].stream !== null) {
            if (_feeds[f_type].stream.connection.connectionId == event.stream.connection.connectionId) {
                this.checkPrivateCall(_feeds[f_type]);
                _feeds[f_type].stream = null;
                this.setState({feeds:_feeds});

                // remove user from users state
                if(f_type === 'fan') {
                  var _user = this.getUserByConnectionId(this.lastUserConnectionIdBackstage)
                  if (_user) {
                    this.removeUserFromState(_user);
                  }
                }
            }
        }
    },

    removeUserFromState: function(user) {
      var _users = this.state.users;
      var filteredUsers = _users.filter(function(u){
          return u.connection.connectionId !== user.connection.connectionId;
      });
      this.setState({ users: filteredUsers});
    },
    onStreamDestroyed: function(event) {
        var _feeds = this.state.feeds;
        var f_type = '';
        switch(event.stream.connection.data) {
            case 'usertype=fan':
                this.removeFanStream(event.stream);
                var _user = this.getUserByConnectionId(event.stream.connection.connectionId);
                if (_user && !_user.connectedToHost) {
                  this.removeUserFromState(_user);
                }
                if(event.stream.connection.connectionId == this.state.userInCall) {

                    var feed_in_call =  this.feedInPrivateCall();
                    var _feeds = this.state.feeds;
                    if(!_.isEmpty(feed_in_call) && _feeds['backstage_fan'].stream !== null){
                        if(_feeds['backstage_fan'].stream.connection.connectionId === feed_in_call[0].stream.connection.connectionId) {
                          this.refs.dashboard.setInCallStatus({ inCall: null, with:null });
                          this.unsubscribeUserCall();
                          _feeds["backstage_fan"].stream = null;
                          this.setState({feeds:_feeds});
                        }
                    } else {
                      this.unsubscribeUserCall();
                    }
                    return;
                } else {
                    f_type = 'backstage_fan';

                }
                break;
        }
        if(f_type !== '') {
            if(_feeds[f_type].stream !== null) {
                if(_feeds[f_type].stream.connection.connectionId == event.stream.connection.connectionId) {
                    _feeds[f_type].stream = null;
                    this.setState({feeds:_feeds});
                }
            }
        }
    },

    addFanStream: function(stream){
        var _streams = this.state.streams.concat([stream]);
        this.setState({ streams: _streams});
    },

    removeFanStream: function(stream) {
        var _streams = this.state.streams;
        var filteredStreams = _streams.filter(function(s){
            return s.connection.connectionId !== stream.connection.connectionId;
        });
        this.setState({ streams: filteredStreams});
    },

    findStreamByConnectionId: function(connectionId){
        var _streams = this.state.streams;
        var _stream = _streams.filter(function(s){
            return s.connection.connectionId == connectionId;
        })[0];
        return _stream;
    },

    onStreamCreated: function(event) {
        if(event.stream.connection.data === 'usertype=fan') {
          this.addFanStream(event.stream);
          this.requestPresenceAnnouncement(event.stream.connection);
        }
    },

    onConnectionDestroyed: function(event) {
        var _user = this.getUserByConnectionId(event.connection.connectionId);
        if (_user) {
          this.removeUserFromState(_user);
        }
    },

    onStreamPropertyChanged: function (event) {
      console.log('onStreamPropertyChanged', event);
    },

    checkDuplicatedStream: function(event) {
        var _feeds = this.state.feeds;
        var f_type = '';
        var bDuplicated = false;
        var connection = event.stream ? event.stream.connection : event.connection;;
        switch(connection.data) {
            case 'usertype=fan': f_type = 'fan';
                                 break;
            case 'usertype=host': f_type = 'host';
                                 break;
            case 'usertype=celebrity': f_type = 'celebrity';
                                 break;
        }
        if(f_type !== '') {
            if(_feeds[f_type].stream) {
                bDuplicated = true;
                this.state.onstageSession.forceDisconnect(connection, function(error){
                    if (error) {
                        console.log('forceDisconnect:error', error);
                    } else {
                        console.log('forceDisconnect:', f_type);
                    }
                });
            }
        }
        return bDuplicated;
    },

    onStageSessionStreamCreated: function(event) {
        if(this.checkDuplicatedStream(event)) return;
        if(event.stream.connection.data === 'usertype=producer') return;
        var _feeds = this.state.feeds;
        var _this = this;
        var f_type = "";
        var subscriber;
        switch(event.stream.connection.data) {
            case 'usertype=fan':
                f_type = 'fan';
                _this.logEvent('producer_subscribes_fan_onstage', OTKVariation.ATTEMPT);
                subscriber = this.state.onstageSession.subscribe(event.stream, 'fanBox', this.props.streamUIOptions, function(error) {
                  if(error) {
                    _this.logEvent('producer_subscribes_fan_onstage', OTKVariation.FAILURE);
                  } else {
                    _this.logEvent('producer_subscribes_fan_onstage', OTKVariation.SUCCESS);
                  }
                });
                subscriber.subscribeToAudio(true).subscribeToVideo(true);
                break;
            case 'usertype=host':
                f_type = 'host';
                _this.logEvent('producer_subscribes_host_onstage', OTKVariation.ATTEMPT);
                subscriber = this.state.onstageSession.subscribe(event.stream, 'hostBox', this.props.streamUIOptions, function(error) {
                  if(error) {
                    _this.logEvent('producer_subscribes_host_onstage', OTKVariation.FAILURE);
                  } else {
                    _this.logEvent('producer_subscribes_host_onstage', OTKVariation.SUCCESS);
                  }
                });
                break;
            case 'usertype=celebrity':
                f_type = 'celebrity';
                _this.logEvent('producer_subscribes_celebrity_onstage', OTKVariation.ATTEMPT);
                subscriber = this.state.onstageSession.subscribe(event.stream, 'celebrityBox', this.props.streamUIOptions, function(error) {
                  if(error) {
                    _this.logEvent('producer_subscribes_celebrity_onstage', OTKVariation.FAILURE);
                  } else {
                    _this.logEvent('producer_subscribes_celebrity_onstage', OTKVariation.SUCCESS);
                  }
                });
                break;
        }
        _feeds[f_type].stream = event.stream;
        _feeds[f_type].user = event.stream;
        _feeds[f_type].subscriber = subscriber;
        _feeds[f_type].onBackStage = false;
        _feeds[f_type].mute = !event.stream.hasAudio;
        _feeds[f_type].videoMuted = !event.stream.hasVideo;
        _feeds[f_type].audioVolume = 100;
        _feeds[f_type].shouldShowCountback = false;

        this.setState({feeds:_feeds});

        // si es host o celebrity agregar el user al users array
        if (f_type == 'host' || f_type == 'celebrity' || f_type == 'fan') {
          var _userData = {
            connection: event.stream.connection,
            chat: {
              chatting: false,
              videoChatting: false,
              messages: [],
              last_active: null
            },
            identifier: this.state.users_count,
            user: {
              username: f_type,
              quality: 'Online',
            },
            isSpecialChat: true
          };

          var new_count = this.state.users_count + 1;
          var _users = this.state.users.concat([_userData]);
          this.setState({ users: _users,users_count:new_count});

          // send open chat message for host/celeb
          var message = {
            to: _userData.connection,
            type: 'openChat'
          };
          this.state.onstageSession.signal(message, function(error){
              if (error) {
                  console.log('onstageSession.signal: error', error);
              }
          });
        }
    },

    onSessionConnected: function(error) {
        if(error) {
            console.log('onSessionConnected:error', error);
            this.logEvent('producer_connects_backstage', OTKVariation.FAILURE);
            return;
        }
        this.logEvent('producer_connects_backstage', OTKVariation.SUCCESS);
        this.publisher();
        this.logEvent('producer_publishes_backstage', OTKVariation.ATTEMPT);
        this.state.backstageSession.publish(this.producerPublisher, this.onPublishBackstageCompleted);
        var _connectedTo = this.state.connectedTo;
        _connectedTo.backstage = true;
        this.setState({connectedTo: _connectedTo});
    },

    onArchiveStarted: function(event) {
        window.archiveId = event.id;
    },

    onArchiveStopped: function(event) {
        window.archiveId = null;
    },

    onOnstageSessionConnected: function(error) {
        if (error) {
            console.log('onOnstageSessionConnected:error', error);
            if(error.code === 1004){
              this.displayApiKeyError();
              this.ajaxHandler.postRequest(
                  "/admin/send_apikey_error",
                  {
                    event: this.state.event.event_name
                  }
              );
            }
            return;
        }
        var event = this.state.event;
        var data = this.state.data;
        // Used for broadcast signaling
        var sessionData = { sessionId: data.sessionIdHost,
                             event_name: event.event_name,
                             event_image: event.event_image,
                             apikey: data.apiKey,
                             apisecret: data.apisecret,
                             eventKey: [event.fan_url, this.props.elem.getAttribute("admins_id")].join('-'),
                             broadcastEnabled: this.isBroadcastEnabled() ? 'true' : 'false'
                            }
        this.socket.emit('producerJoinRoom', sessionData);
        if(this.isBroadcastEnabled()) {
          this.socket.emit('requestBroadcastURL', event.stage_sessionid);
        }
        this.sendStartEventSignal();
        this.startLoggingEngine();
        this.logEvent('producer_connects_onstage', OTKVariation.SUCCESS);
        var _connectedTo = this.state.connectedTo;
        _connectedTo.onstage = true;
        this.setState({connectedTo: _connectedTo});
        if(this.state.event.status !== 'L') {
          this.producerPrivatePublisher();
          this.logEvent('producer_publishes_onstage', OTKVariation.ATTEMPT);
          this.state.onstageSession.publish(this.privatePublisher, this.onPublishOnstageCompleted);
        }
    },

    onPublishOnstageCompleted: function (error) {
      if(error){
        this.logEvent('producer_publishes_onstage', OTKVariation.FAILURE);
      } else {
        this.logEvent('producer_publishes_onstage', OTKVariation.SUCCESS);
      }

    },

    onPublishBackstageCompleted: function (error) {
      if(error){
        this.logEvent('producer_publishes_backstage', OTKVariation.FAILURE);
      } else {
        this.logEvent('producer_publishes_backstage', OTKVariation.SUCCESS);
      }

    },

    onAjaxRequestError: function(error) {
        console.log('onAjaxRequestError:error', error);
    },

    stopPublishingOnStage: function (){
      if(this.privatePublisher) {
        this.state.onstageSession.unpublish(this.privatePublisher);
        this.privatePublisher.off();
        this.privatePublisher.disconnect();
        this.privatePublisher.destroy();
      }
    },

    getStreamUIOptions: function() {
      return {
        insertMode: "append",
        showControls:false,
        publishVideo: false,
        videoSource: null
      }
    },

    publisher: function() {
        if (!this.producerPublisher) {
            this.producerPublisher = this.props.OT.initPublisher("producerBox", this.getStreamUIOptions());
            this.producerPublisher.on('accessAllowed', this.onAccessAllowed);
            this.producerPublisher.on('accessDenied', this.onAccessDenied);
            this.producerPublisher.on('accessDialogClosed', this.onAccessDialogClosed);
            this.producerPublisher.on('accessDialogOpened', this.onAccessDialogOpened);
        }
        return this.producerPublisher;
    },

    ///Publisher Private Call
    producerPrivatePublisher: function() {
        if (!this.privatePublisher) {
            this.privatePublisher = this.props.OT.initPublisher("producerBox", this.getStreamUIOptions());
            this.privatePublisher.on('accessAllowed', this.onAccessAllowedOnStage);
            this.privatePublisher.on('accessDenied', this.onAccessDeniedOnStage);
            this.privatePublisher.on('accessDialogClosed', this.onAccessDialogClosed);
            this.privatePublisher.on('accessDialogOpened', this.onAccessDialogOpenedOnStage);
        }
        return this.privatePublisher;
    },
    requestPresenceAnnouncement: function(connection) {
        var signal = {
          to: connection,
          type: 'resendNewFanSignal'
        };
        this.state.backstageSession.signal(signal);
    },

    onAccessAllowed: function(event) {
      this.logEvent('producer_accepts_camera_permissions_backstage', OTKVariation.SUCCESS);
      var accessAllowedCount = this.state.accessAllowedCount + 1;
      this.setState({ accessAllowedCount: accessAllowedCount });
      if(accessAllowedCount > 1 || this.state.event.status === 'L') swal.close();
    },

    onAccessDenied: function(event) {
      this.logEvent('producer_accepts_camera_permissions_backstage', OTKVariation.FAILURE);
      this.renderPermissionDeniedOverlay();
    },

    onAccessDialogOpened: function(event) {
      this.logEvent('producer_accepts_camera_permissions_backstage', OTKVariation.ATTEMPT);
      this.renderPermissionRequestOverlay();
    },

    onAccessAllowedOnStage: function(event) {
      this.logEvent('producer_accepts_camera_permissions_onstage', OTKVariation.SUCCESS);
      this.onAccessAllowed(event);
    },

    onAccessDeniedOnStage: function(event) {
      this.logEvent('producer_accepts_camera_permissions_onstage', OTKVariation.FAILURE);
      this.renderPermissionDeniedOverlay();
    },

    onAccessDialogOpenedOnStage: function(event) {
      this.logEvent('producer_accepts_camera_permissions_onstage', OTKVariation.ATTEMPT);
      this.renderPermissionRequestOverlay();
    },

    onWarningSignalReceived: function(event) {
      if (event.from && (event.from.data === 'usertype=host' ||
        event.from.data === 'usertype=celebrity' || event.from.data === 'usertype=fan')) {
        var data = utils.jsonParse(event.data);
        if (!data) return;
        var users = this.state.users;
        var index = this.findUserByConnectionId(data.connectionId);
        var user = users[index];
        if(typeof(index) !== 'undefined') {
          user.user.show_warning = true;
          this.setState({ users: users });
        }
      } else {
        console.log('Got a signal from an unexpected origin. Ignoring');
      }
    },

    onNewFanAppeared: function(event) {
      if (event.from && event.from.data === 'usertype=fan') {
        var _this = this;
        var _userData = utils.jsonParse(event.data);
        _userData.connection = event.from;
        _userData.identifier = this.state.users_count;
        _userData.chat = {
            chatting:false,
            videoChatting:false,
            messages:[],
            last_active:null
        };
        var new_count = this.state.users_count + 1;
        var _users = this.state.users.concat([_userData]);
        this.setState({ users: _users,users_count:new_count});

        var ackSignal = {
          to: event.from,
          type: 'newFanAck'
        };
        this.state.backstageSession.signal(ackSignal);
      } else {
        console.log('Got a signal from an unexpected origin. Ignoring');
      }
    },

    subscribeUserCall: function(user) {
        var stream = this.findStreamByConnectionId(user.connection.connectionId);
        var feeds = this.state.feeds;
        var box_id = ['feed_', user.connection.connectionId].join('');
        var subscriber = this.state.backstageSession.subscribe(stream, box_id, _.defaults({ width: "100%", height: "100%", audioVolume: 100 },this.props.streamUIOptions));
        this.setState({ userInCall: stream.connection.connectionId, userInCallSubscriber: subscriber });
        this.muteOnstageFeeds(true,false);
        if(feeds['backstage_fan'].stream !== null && feeds['backstage_fan'].stream.connection.connectionId == user.connection.connectionId) {
            feeds['backstage_fan'].inCall = true;
            this.setState({feeds:feeds});
        }
    },
    checkAndDisconnectPrivateCall:function(){

      var feed_in_call =  this.feedInPrivateCall();
      if(!_.isEmpty(feed_in_call)){
          this.disconnectFeedFromPrivateCall(feed_in_call[0]);
          this.refs.dashboard.setInCallStatus({ inCall: null, with:null });
      }
    },
    feedInPrivateCall:function(){
        var feeds = this.state.feeds;
        return _.filter(feeds,function(feed){ return feed.inCall;});
    },
    disconnectFeedFromPrivateCall:function(feed){
        if(feed.type == "backstage_fan"){
            var connectSignal = {
                to: feed.stream.connection,
                type: 'disconnectProducer'
            };
            this.state.backstageSession.signal(connectSignal, this.onSignalCompleted);
            this.unsubscribeUserCall();
        }else{
            var privateCallSignal = {
                type: 'endPrivateCall',
                data: JSON.stringify({ callWith: feed.stream.connection.connectionId }),
            };
            this.state.onstageSession.signal(privateCallSignal);
        }
        var feeds = this.state.feeds;
        feeds[feed.type].inCall = false;
        this.muteOnstageFeeds(false,null);

    },
    unsubscribeUserCall: function() {
        if(this.state.userInCall !== null) {
            var feeds = this.state.feeds;
            if (this.state.userInCallSubscriber) {
                var stream = this.state.userInCallSubscriber.stream;
                //this.removeUpdatedEventOnStream(stream);
                this.muteOnstageFeeds(false,false);
                if(feeds['backstage_fan'].stream !== null && feeds['backstage_fan'].stream.connection.connectionId == stream.connection.connectionId){
                    feeds['backstage_fan'].inCall = false;
                }
                this.state.backstageSession.unsubscribe(this.state.userInCallSubscriber);
            }
            this.setState({userInCall: null, userInCallSubscriber: null,feeds:feeds});
        }
    },

    subscribeUserBackstage: function(connectionId) {
        var _feeds = this.state.feeds;
        var stream = this.findStreamByConnectionId(connectionId);
        var _this = this;
        if (stream) {
            _this.logEvent('producer_subscribes_fan_backstage', OTKVariation.ATTEMPT);
            var subscriber = this.state.backstageSession.subscribe(stream, 'backstage_fanBox', this.props.streamUIOptions, function(error) {
              if(error) {
                _this.logEvent('producer_subscribes_fan_backstage', OTKVariation.FAILURE);
              } else {
                _this.logEvent('producer_subscribes_fan_backstage', OTKVariation.SUCCESS);
              }
            });
            _feeds["backstage_fan"].stream = stream;
            _feeds["backstage_fan"].subscriber = subscriber;
            _feeds["backstage_fan"].onBackStage = true;
            _feeds['backstage_fan'].videoMuted = false;
            _feeds['backstage_fan'].mute = false;
            _feeds['backstage_fan'].audioVolume = 100;
            this.setState({feeds:_feeds});
            this.sendJoinBackstageSignal(stream.connection);
        }

        // notify host and celebrity new fan is in backstage
        var _this = this;
        _.each(_feeds, function(feed) {
          if (feed.stream && (feed.type == 'host' || feed.type == 'celebrity')) {
            _this.state.onstageSession.signal({to: feed.stream.connection, type: 'newBackstageFan'});
          }
        });
    },

    sendJoinBackstageSignal: function(connection) {
        var signal = {
          to: connection,
          type: 'joinBackstage'
        };
        this.state.backstageSession.signal(signal);
    },

    sendKickBackstageSignal: function(connection) {
        var signal = {
          to: connection,
          type: 'disconnectBackstage'
        };
        this.state.backstageSession.signal(signal);
    },

    unsubscribeUserBackstage: function() {
        var _feeds = this.state.feeds;
        var _this = this;
        var _users = this.state.users;
        if (_feeds["backstage_fan"].stream !== null) {
            if(_feeds["backstage_fan"].inCall) {
                this.disconnectFeedFromPrivateCall(_feeds["backstage_fan"]);
                this.refs.dashboard.setInCallStatus({ inCall: null, with:null });
            }
            var index = this.findUserByConnectionId(_feeds["backstage_fan"].stream.connection.connectionId);
            if (_users[index]) {
                _users[index].backstageConnected = false;
                this.setState({users: _users});
            }

            this.sendKickBackstageSignal(_feeds["backstage_fan"].stream.connection);

            var subscribers = this.state.backstageSession.getSubscribersForStream(_feeds["backstage_fan"].stream);
            _.each(subscribers, function(subscriber) {
                _this.logEvent('producer_unsubscribes_fan_backstage', OTKVariation.ATTEMPT);
                _this.state.backstageSession.unsubscribe(subscriber);
                _this.logEvent('producer_unsubscribes_fan_backstage', OTKVariation.SUCCESS);
            });

            this.removeUpdatedEventOnStream(_feeds["backstage_fan"].stream);
            _feeds["backstage_fan"].stream = null;
            this.setState({feeds:_feeds});
        }
    },

    // NOTE: this is the fix to avoid next error:
    // Uncaught TypeError: Cannot read property 'hasVideo' of null
    // we probable should open an bug issue for opentok.js or something when we are
    // completely sure that it is a problem of the library
    removeUpdatedEventOnStream: function (stream) {
      stream.off('updated');
    },

    changeFeedState: function(_feed) {
        var _feeds = this.state.feeds;
        _feeds[_feed.type] = _feed;
        this.setState({feeds:_feeds});
    },

    changeFeedCountback: function(feed_type,shouldCount,connection) {
        var _feeds = this.state.feeds;
        _feeds[feed_type].shouldShowCountback = shouldCount;
        var next_fan_feed = connection ? connection : this.state.nextFanConnection;
        this.setState({feeds:_feeds, nextFanConnection:next_fan_feed});

    },

    changeUserState: function(connectionId,options) {
        var users = this.state.users;
        var index = this.findUserByConnectionId(connectionId);
        users[index] = options;
        this.setState({users:users});
    },

    openHostCelebChat: function(connectionId) {
        var users = this.state.users;
        var index = this.findUserByConnectionId(connectionId);
        users[index].chat.chatting = true;
        users[index].chat.last_active = new Date();
        this.setState({users:users});
    },

    setUserBackstage: function(connectionId) {
        var _users = this.state.users;
        this.unsubscribeUserBackstage();
        if(connectionId !== null) {
            this.subscribeUserBackstage(connectionId);
            var index = this.findUserByConnectionId(connectionId);
            if(_users[index]) {
                _users[index].backstageConnected = true;
                this.setState({users: _users});
            }
        }
    },

    sendMessage: function(options){
        if (_.isEmpty(options.message.trim())) return;
        var _this = this;
        var message = {
            to: options.to,
            data: JSON.stringify({
                message: {
                    to: {connectionId: 'me'},
                    message: options.message,
                    user_key: options.user_key,
                },
            }),
            type: 'chatMessage'
        };
        if (options.to.data === 'usertype=host' || options.to.data === 'usertype=celebrity') {
          this.state.onstageSession.signal(message, function(error){
              if (error) {
                  console.log('onstageSession.signal: error', error);
              } else {
                  _this.addMessageToChat(message.to.connectionId, message);
              }
          });
        } else {
          this.state.backstageSession.signal(message, function(error){
              if (error) {
                  console.log('backstageSession.signal: error', error);
              } else {
                  _this.addMessageToChat(message.to.connectionId, message);
              }
          });
        }
    },

    sendCloseChatSignal: function(to){
        var _this = this;
        var message = {
            to: to,
            type: 'closeChat'
        };
        this.state.backstageSession.signal(message, function(error){
            if (error) {
                console.log('backstageSession.signal: error', error);
            } else {
                console.log('message sent.');
            }
        });
    },
    closeUserChatting:function(connection){
            var _user =  this.getUserByConnectionId(connection.connectionId)
            this.sendCloseChatSignal(connection);
            _user.chat.chatting = false;
            this.changeUserState(connection.connectionId,_user);
    },
    closeHostCelebChatting: function(connection) {
        var _user = this.getUserByConnectionId(connection.connectionId);
        _user.chat.chatting = false;
        this.changeUserState(connection.connectionId,_user);
    },
    kickFan: function(connectionId) {
        var index = this.findUserByConnectionId(connectionId);
        if (typeof(index) === 'undefined' || index < 0) return;
        var users = _.uniq(this.state.users);
        var _this = this;
        this.state.backstageSession.forceDisconnect(users[index].connection, function(error) {
            if (error) {
                console.log('forceDisconnect:error', error);
            } else {
                users.splice(index, 1);
                _this.setState({ users: users });
            }
        });
    },

    addMessageToChat: function(connectionId, message) {
        var data = utils.jsonParse(message.data);
        var body = data.message;
        var users = this.state.users;
        var index = this.findUserByConnectionId(connectionId);
        if (typeof(index) === 'undefined') return;
        if(body.to === undefined) {
          body.to = {connectionId: connectionId};
        }
        users[index].chat.messages.push(body);
        users[index].chat.last_active = new Date();
        this.setState({ users: users });
        this.refs.chatFooter.updateScroll(users[index].connection.connectionId);
    },
    setLastActive: function(connectionId){
        var index = this.findUserByConnectionId(connectionId);
        if (typeof(index) === 'undefined') return;
        var users = this.state.users;
        users[index].chat.last_active = new Date();
        this.setState({ users: users });
    },
    findUserByConnectionId: function(connectionId) {
        var index;
        var users = this.state.users;
        _.each(users, function(user, idx) {
            if (user.connection.connectionId === connectionId) return index = idx;
        });
        return index;
    },
    findUserInfoByConnectionId:function(connectionId){
        var index;
        var users = this.state.users;
        return _.findWhere(users, function(user) {
            return (user.connection.connectionId === connectionId)
        });
    },

    getUserByConnectionId: function(connectionId) {
        var users = this.state.users;
        var index = this.findUserByConnectionId(connectionId);
        return users[index];
    },

    isInFanCall: function () {
        return (this.state.userInCall !== null);
    },

    isBroadcastEnabled: function () {
      return this.props.elem.getAttribute("broadcast_enabled") === 'true';
    },

    displayApiKeyError: function () {
      var html = [
        "Your API or Secret Keys seem to be invalid, please check with your account manager to proceed.",
      ].join('<br/>');
      swal({
        title: "ERROR.",
        text: html,
        type: "error",
        html: true
      });
    },

    renderPermissionDeniedOverlay: function() {
      var html = [
        "Please allow access to your microphone to continue.",
        "Click the camera icon in your browser bar",
        "to view the permissions dialog.",
      ].join('<br/>');
      swal({
        title: "No microphone access.",
        text: html,
        type: "error",
        html: true
      });
    },

    renderPermissionRequestOverlay: function() {
      swal({
        title: "<div style='color: #3dbfd9'>Hi There!</div>",
        text: '<h4>Please allow access to your <br/> microphone to continue.</h4>',
        html: true,
        timer: 999999,
        showConfirmButton: true
      });
    },

    render: function () {
        var dashboard = React.createElement(Dash, {
            setUserBackstage: this.setUserBackstage,
            event: this.state.event,
            interactiveLimit: this.props.elem.getAttribute("interactive_limit"),
            broadcastEnabled: this.isBroadcastEnabled,
            admins_id: this.props.elem.getAttribute("admins_id"),
            postProductionUrlEnabled: this.props.elem.getAttribute("postproductionurl_enabled") === 'true',
            signalingUrl: this.props.elem.getAttribute('signaling_url'),
            feeds: this.state.feeds,
            changeFeedState: this.changeFeedState,
            changeFeedCountback:this.changeFeedCountback,
            onEventGoLive: this.eventGoLive,
            onMoveToFan: this.moveToFan,
            onstageSession: this.state.onstageSession,
            backstageSession: this.state.backstageSession,
            getUserByConnectionId: this.getUserByConnectionId,
            endEvent: this.endEventShow,
            openHostCelebChat: this.openHostCelebChat,
            connectedTo: this.state.connectedTo,
            removeUserFromState: this.removeUserFromState,
            muteOnstageFeeds:this.muteOnstageFeeds,
            unsubscribeUserCall: this.unsubscribeUserCall,
            subscribeUserCall: this.subscribeUserCall,
            sendConnectNowSignal: this.sendConnectNowSignal,
            key:"dashboard",
            isInFanCall:this.isInFanCall,
            checkAndDisconnectPrivateCall:this.checkAndDisconnectPrivateCall,
            ref:"dashboard"
        });

        var chatFooter = React.createElement(ChatFooter, {
            ref: 'chatFooter',
            send_message: this.sendMessage,
            sendCloseChatSignal: this.sendCloseChatSignal,
            change_event: this.changeUserState,
            stopChatting:this.closeUserChatting,
            closeHostCelebChatting: this.closeHostCelebChatting,
            users: this.state.users,
            set_last_active:this.setLastActive,
            key:"chat"
        });

        var fanList = React.createElement(UserList, {
            onMoveToFan: this.moveToFan,
            unsubscribeUserCall: this.unsubscribeUserCall,
            subscribeUserCall: this.subscribeUserCall,
            setUserBackstage: this.setUserBackstage,
            isInFanCall:this.isInFanCall,
            kickFan: this.kickFan,
            change_event: this.changeUserState,
            users: this.state.users,
            OT: this.props.OT,
            publisher: this.publisher(),
            backstageSession: this.state.backstageSession,
            feeds: this.state.feeds,
            onstageSession: this.state.onstageSession,
            data:this.state.data,
            removeUserFromState: this.removeUserFromState,
            key:"list"
        });

        if(!this.state.doNotConnect) {
          var mainView = React.createElement("div", { className:"content sidepanel-active", key:"mainView"}, [dashboard, chatFooter]);
          return React.createElement("div", {key:"adminView"}, [mainView, fanList]);
        } else {
          swal.close();
          return React.createElement(blockProducerView, {event: this.state.event, username: this.props.elem.getAttribute("username")});
        }

    }
});
module.exports = ShowContainer;
