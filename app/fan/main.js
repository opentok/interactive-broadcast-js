/** @jsx React.DOM */
var React                    = require('react');
var AjaxHandler              = require('./../common/ajax-handler');
var LostConnectionWarning    = require('./../common/lostConnectionWarning');
var React                    = require('react');
var _                        = require('underscore');
var $                        = require('jquery');
var OnUnload                 = require("react-window-mixins").OnUnload;

var Wrapper                  = require('./partials/wrapper');
var ChatFooter               = require('./../common/single_user_chat');
var PermissionRequestOverlay = require('./partials/permissionRequestOverlay');
var PermissionDeniedOverlay  = require('./partials/permissionDeniedOverlay');
var FanErrorView             = require('./fanErrorView');
var BroadcastApp             = require('./../broadcast/main');
var NetworkTest              = require('./networkTest');
var utils                    = require('../utils/utils');
var ReactToastr              = require('react-toastr');
var Analytics                = require('opentok-solutions-logging');
var ToastContainer           = ReactToastr.ToastContainer;
var ToastMessageFactory      = React.createFactory(ReactToastr.ToastMessage.animation);
var OTKVariation = {
  SUCCESS:"Success",
  ATTEMPT:"Attempt",
  FAILURE:"Fail"
};

var App = React.createClass({
  mixins: [ OnUnload ],

  getInitialState: function() {
    return {
      data: {},
      userName: '',
      quality: '',
      btnText: 'Get In Line',
      joinProducer: false,
      producerStream: null,
      privateProducerStream: null,
      hostStream: null,
      celebrityStream: null,
      fanStream: null,
      newWindow: false,
      streamUIOptions: {
        showControls: false,
        width: "100%",
        height: "100%",
        frameRate: 15,
        insertMode: 'append',
        mirror:true,
        audioVolume:100,
        fitMode: 'contain'
      },
      subscribers:{},
      user: {},
      userVideo: {
        mirrored: true
      },
      event: null,
      attemptInLine: false,
      inLine: false,
      accessAllowed: false,
      accessDenied: false,
      leftLine: false,
      kicked: false,
      connectedToHost: false,
      connectedToBackstage: false,
      newFanSignalAckd: false,
      height:0,
      inCallStatus:null,
      minimized: false,
      producerSubscriber:null,
      subscribeToAudio: this.props.elem.getAttribute("subscribe_audio") === 'true',
      cropVideo:true,
      fanState: {
        connectedToOnstageSession: null,
        subscribingHost: null,
        subscribingCelebrity: null,
        subscribingFan: null
      },
      connectionError: false,
      ableToJoin: true,
      broadcastEnabled: this.props.elem.getAttribute("broadcast_enabled") === 'true'
    };
  },

  getDefaultProps: function() {
    return {
      getInLineText: 'Get In Line',
      leaveLineText: 'Leave Line',
      getInLineBtnClass: 'btn-success',
      leaveLineBtnClass: 'btn-danger',
      unstartedBtnClass: 'btn btn-light btn-lg btn-block',
      eventOverBtnClass: 'btn fan-status stat-red'
    };
  },
  componentDidMount: function () {
    var _this = this;
    if(this.inEmbedWidget()){
      $('#fanApp').css({'background-color':'rgba(255, 0, 0, 0)'})
      $('body').css({'background':'none'})
    }
    this.lostConnectionWarning = new LostConnectionWarning();
    if(this.props.elem.getAttribute("crop_video") == "false"){
      this.setState({"cropVideo":false});
    }
    window.addEventListener("resize", this.updateDimensions);
    OT.on('exception', this.onOTException);
  },

  requestCreateService: function () {
    this.ajaxHandler.postRequest(
      '/create_service',
      {
        fan_url:this.props.elem.getAttribute("url"),
        admins_id:this.props.elem.getAttribute("admins_id"),
        user_id:this.props.fingerprint_data.user_id,
        os:this.props.fingerprint_data.os,
        is_mobile:this.props.fingerprint_data.is_mobile
      },
      this.onSessionDataReceived,
      this.onAjaxRequestError
    );
  },

  onOTException: function(evt) {
    if(evt.code == 1553 || evt.code == 1554 || evt.code == 1006) {
      this.connectionDropped();
    }
  },

  componentWillUnmount: function() {
    this.publisher && this.publisher.destroy();
    window.removeEventListener("resize", this.updateDimensions);
    this.closeWebsocketConnection();

  },
  componentWillMount: function() {
    this.ajaxHandler = new AjaxHandler();
    this.openBroadcastPresenceConnection();
    this.updateDimensions();
  },
  updateDimensions:function(){
    var _height = $(window).width() > 750 ? $(window).height() - 150 : "auto";
    this.setState({height: _height});
  },
  onBeforeUnload: function() {
    this.forgetPresence();
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

  logEvent: function(data) {
    if(this.OTKlogging) this.OTKlogging.logEvent(data);
  },

  startWebsocketConnection: function() {
    this.io = this.io || window.io;
    this.socket = this.io.connect(this.props.elem.getAttribute("signaling_url"));
  },

  openBroadcastPresenceConnection: function() {
    var _this = this;
    this.startWebsocketConnection();
    var userHasIncompatibleBrowser = (this.props.fingerprint_data.browser === 'Safari');
    if(this.props.elem.getAttribute("session_id") === '' || userHasIncompatibleBrowser) {
      this.onAbleToJoin({ableToJoin:true});
      return;
    }
    this.socket.on('serverConnected', function() {
        _this.socket.emit('joinInteractive', _this.props.elem.getAttribute("session_id"));
    });
    this.socket.on('ableToJoin', this.onAbleToJoin);
  },

  onAbleToJoin: function(data) {
    if(data.ableToJoin){
      this.requestCreateService();
    } else {
      if(this.state.broadcastEnabled) {
        window.location.href = window.location.href;
        return;
      }
      this.setState({ableToJoin:false});
      this.closeWebsocketConnection();
    }
  },

  closeWebsocketConnection: function() {
    this.socket && this.socket.disconnect();
    this.socket = null;
  },



  cleanUpSession: function(session, publisher) {
    if (session) {
      if (publisher) {
        session.unpublish(publisher);
      }
      this.unsubscribeSelfSubscriber();
      session.off();
      session.disconnect();
    }
  },

  enableVideoAudio: function() {
    this.publisher && this.publisher.publishVideo(true).publishAudio(true);
    this.setState({ minimized: false });
  },

  disableVideoAudio: function() {
    this.publisher && this.publisher.publishVideo(false).publishAudio(false);
    this.setState({ minimized: true });
  },
  changeHostSessionVolume:function(volume){
    ///we mute all streams
    _.each(this.state.subscribers,function(subscriber){
      if(subscriber){
        return subscriber.setAudioVolume(volume);
      }
    });
  },
  onPrivateCall:function(event){
     if (event.from && event.from.data === 'usertype=producer') {
      if(!this.isUserOnstage()){
        return;
      }
      var data = utils.jsonParse(event.data);
      if(this.hostPublisher && this.hostPublisher.stream.connection.connectionId == data.callWith){
        this.logEvent({ action: "FanSubscribesProducer", variation: OTKVariation.ATTEMPT });
        var options = this.state.streamUIOptions;
        options.subscribeToVideo = false;
        var producerSubscriber = this.hostSession.subscribe(this.state.privateProducerStream, 'prodBox',options,this.onProducerSubscribed);
        this.setState({"ProducerSubscriber":producerSubscriber});
        this.setState({inCallStatus:"on_private_producer_call"});
      }else{
        this.setState({inCallStatus:"temporarilly_muted"});
      }
      this.changeHostSessionVolume(0);
    }
  },
  onProducerSubscribed:function (error) {
    if (error) {
      this.logEvent({ action: "FanSubscribesProducer", variation: OTKVariation.FAILURE });
      console.log(error);
    } else {
      this.logEvent({ action: "FanSubscribesProducer", variation: OTKVariation.SUCCESS });
    }
  },
  endPrivateCall:function(event){
    if (event && event.from && event.from.data !== 'usertype=producer') return;
    if(!this.isUserOnstage()){
      return;
    }
    if(this.state.producerSubscriber){
      this.logEvent({ action: "FanSubscribesProducer", variation: OTKVariation.SUCCESS });
      this.hostSession.unsubscribe(this.state.producerSubscriber);
      this.setState({"producerSubscriber":null});
    }
    this.setState({inCallStatus:"on_stage"});
    this.changeHostSessionVolume(100);
  },
  connectToBackstageSession: function() {
    var data = this.state.data;
    var OT = this.props.OT;

    this.logEvent({ action: "FanConnectsBackstage", variation: OTKVariation.ATTEMPT });
    //OT.properties.apiUrl = OT.properties.apiURLSSL = "https://anvil-preview.tokbox.com";
    this.producerSession = OT.initSession(data.apiKey, data.sessionIdProducer);
    this.producerSession.on('streamDestroyed', this.onStreamDestroyed);
    this.producerSession.on('streamCreated', this.onStreamCreated);
    this.producerSession.on('signal:joinProducer', this.subscribeProducer);
    this.producerSession.on('signal:disconnectProducer', this.unsubscribeProducer);
    this.producerSession.on('signal:joinBackstage', this.joinBackstage);
    this.producerSession.on('signal:disconnectBackstage', this.disconnectBackstage);
    this.producerSession.on('signal:joinHost', this.connectWithHost);
    this.producerSession.on('signal:joinHostNow', this.connectWithHostNow);
    this.producerSession.on('signal:chatMessage', this.handleNewMessage);
    this.producerSession.on('signal:videoOnOff', this.videoOnOff);
    this.producerSession.on('signal:muteAudio', this.muteAudio);
    this.producerSession.on('signal:newFanAck', this.ackNewFanSignal);
    this.producerSession.on('signal:resendNewFanSignal', this.resendNewFanSignal);
    this.producerSession.on('signal:closeChat', this.closeChat);
    this.producerSession.on('signal:producerLeaving', this.onProducerLeaving);
    this.producerSession.connect(this.state.data.tokenProducer, this.onConnectedToBackstageSession);
    this.setState({inCallStatus:"waiting_in_line"});
  },

  showCountdown: function(count) {
    swal({
      title: '<h5>GOING LIVE NOW</h5>',
      text: ['<h1 class="count-down text-color5">','<i class="fa fa-spinner fa-pulse color5"></i>','</h1>'].join(''),
      showConfirmButton: false,
      html: true
    });
  },

  setFanState: function (key, value) {
    var _fanState = this.state.fanState;
    _fanState[key] = value;
    this.setState({fanState:_fanState});
    if(value === false) {
      this.connectionDropped();
      if(this.state.inLine) {
        this.sendWarningSignal()
      }
    }
  },

  sendWarningSignal: function () {
    var _this = this;
    var _data = this.state.fanState;
    var subscribing;
    var _connectionId = this.getConnectionId();
    if(_data.subscribingHost === false || _data.subscribingFan === false || _data.subscribingCelebrity === false)  {
      _subscribing = false;
    } else {
      _subscribing = null;
    }
    var message = {
      data: JSON.stringify({
        'connected':  _data.connectedToOnstageSession,
        'subscribing': _subscribing,
        'connectionId': _connectionId
      }),
      type: 'warning'
    };
    if(this.producerSession)  this.producerSession.signal(message, this.onSendWarningSignal);
  },

  startCountdown: function(){
    var _this = this;
    var initialValue = 4;
    this.showCountdown(initialValue);
  },

  goLive: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var _event = this.state.event;
      _event['status'] = 'L';
      this.setState({ event:_event });
      var _subscribers = this.state.subscribers;

      if(!this.state.connectedToHost) {

        if(this.state.hostStream !== null) {
          _subscribers["host"] = this.subscribeStageUser(this.state.hostStream, 'hostBox');
          if(!this.state.subscribeToAudio) {
            _subscribers["host"].subscribeToAudio(false);
          }
        }

        if(this.state.celebrityStream !== null) {
          _subscribers["celebrity"] = this.subscribeStageUser(this.state.celebrityStream, 'celebrityBox');
          if(!this.state.subscribeToAudio) {
            _subscribers["celebrity"].subscribeToAudio(false);
          }
        }

        if(this.state.fanStream !== null) {
          _subscribers["fan"] = this.subscribeStageUser(this.state.fanStream, 'fanBox');
        }
        this.setState({"subscribers":_subscribers});
      }
    }
  },

  subscribeStageUser: function (stream, boxId) {
    var options = this.state.streamUIOptions;
    var _this = this;
    var fanStateKey, logAction;
    if(!this.state.cropVideo && boxId != "fanBox"){
      options.fitMode = "contain";
    }
    switch(boxId) {
      case 'hostBox':
        fanStateKey = 'subscribingHost';
        logAction = "FanSubscribesHost";
        break;
      case 'celebrityBox':
        fanStateKey = 'subscribingCelebrity';
        logAction = "FanSubscribesCelebrity";
        break;
      case 'fanBox':
        fanStateKey = 'subscribingFan';
        logAction = "FanSubscribesFan";
        break;
    }

    this.logEvent({ action: logAction, variation: OTKVariation.ATTEMPT });

    return this.hostSession.subscribe(stream, boxId, options, function(error) {
      if (error) {
        console.log(error.message);
        _this.logEvent({ action: logAction, variation: OTKVariation.FAILURE });
        _this.setFanState(fanStateKey, false);
      } else {
        _this.logEvent({ action: logAction, variation: OTKVariation.SUCCESS });
        _this.setFanState(fanStateKey, true);
      }
    });
  },

  subscribeProducer: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      this.enableVideoAudio();
      this.changeHostSessionVolume(0);
      this.logEvent({ action: "FanSubscribesProducer", variation: OTKVariation.ATTEMPT });
      var subscriber = this.producerSession.subscribe(this.state.producerStream, 'producerBox', this.state.streamUIOptions, this.onProducerSubscribed);
      this.setState({ inCallStatus:'on_producer_call', producerSubscriber: subscriber });
    }
  },

  unsubscribeProducer: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      if(this.state.producerStream !== null && this.state.producerSubscriber) {
        this.logEvent({ action: "FanUnsubscribesProducer", variation: OTKVariation.SUCCESS });
        this.producerSession.unsubscribe(this.state.producerSubscriber);
      }
      this.changeHostSessionVolume(100);
      var newInCallStatus = this.state.connectedToBackstage ? 'backstage' : 'in_line';
      this.setState({ inCallStatus:newInCallStatus, producerSubscriber: null });
    }
  },

  joinBackstage: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      if(this.state.inCallStatus != "on_stage"){
        this.setState({inCallStatus:"backstage"});
        this.setState({connectedToBackstage:true});
      }
      this.enableVideoAudio();
    }
  },

  disconnectBackstage: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      this.logEvent({ action: "FanDisconnectsBackstage", variation: OTKVariation.SUCCESS });
      this.setState({ inCallStatus: 'in_line' });
      this.setState({connectedToBackstage:false});
    }
  },

  ackNewFanSignal: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      this.setState({ newFanSignalAckd: true });
      this.sendSnapshot();
    }
  },

  resendNewFanSignal: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      if (!this.state.newFanSignalAckd) this.sendSignal();
    }
  },

  sendSignal: function() {
    this.setState({ text: 'Sending Signal' });

    var _data = this.state.data;
    var _this = this;
    var message = {
      data: JSON.stringify({
        user : {
          username: _this.state.userName,
          quality: _this.state.quality,
          user_id:_this.props.fingerprint_data.user_id,
          fanState: _this.state.fanState,
          browser: _this.props.fingerprint_data.browser,
          os: _this.props.fingerprint_data.os,
          mobile:false
        }
      }),
      type: 'newFan'
    };
    var user = JSON.parse(message.data);
    user.chat = {
      chatting: false,
      messages: []
    };
    this.setState({ user:user });
    this.producerSession.signal(message, this.onSignalCompleted);
  },

  sendSnapshot: function() {
    var connectionId = this.publisher.stream.connection.connectionId;
    var sessionId = this.producerSession.sessionId;
    var snapshot = this.snapshot;

    this.socket.emit('mySnapshot', {
      connectionId: connectionId,
      snapshot: snapshot,
      sessionId: sessionId
    });
  },

  hidePermissionOverlay: function() {
    this.setState({ accessAllowed: true });
  },

  /** SIGNALS LISTENERS **/
  connectWithHost: function (event) {
    if (event.from && event.from.data === 'usertype=producer'){
      var data = this.state.data;
      var _this = this;
      this.stopNetworkTest();
      this.logEvent({ action: "FanUnpublishesBackstage", variation: OTKVariation.ATTEMPT });
      _this.producerSession.unpublish(_this.publisher);

      if(this.isChrome()) {
        //This is to avoid the console error when reparenting the video element.
        this.initPublisher('fanBox', this.state.streamUIOptions);
      } else {
        var div = $("#userBox > div").detach();
        $("#fanBox").html(div);
      }

      _this.publisher.publishVideo(true);
      _this.publisher.publishAudio(true);
      var _subscribers = _this.state.subscribers;
      if(!_this.isEventLive()) {
        if(_this.state.hostStream !== null) {
          _subscribers["host"] = _this.subscribeStageUser(_this.state.hostStream, 'hostBox');
          if(!_this.state.subscribeToAudio){
            _subscribers["host"].subscribeToAudio(false);
          }
        }
        if(_this.state.celebrityStream !== null) {
          _subscribers["celebrity"] = _this.subscribeStageUser(_this.state.celebrityStream, 'celebrityBox');
          if(!_this.state.subscribeToAudio){
            _subscribers["celebrity"].subscribeToAudio(false);
          }
        }
        _this.setState({"subscribers":_subscribers});
      }
      this.startCountdown();
    }
  },

  connectWithHostNow:function(event){
    if (event.from && event.from.data === 'usertype=producer' && this.isEventLive()){
      this.logEvent({ action: "FanPublishesOnstage", variation: OTKVariation.ATTEMPT });
      this.hostPublisher = this.hostSession.publish(this.publisher,this.onOnstagePublishCompleted);
      var _this = this;
      setTimeout(function(){
        _this.setState({ connectedToHost: true, inCallStatus:"on_stage" });
        swal.close();
      },1000);
    }
  },

  connectToOnStage: function () {
    this.logEvent({ action: "FanConnectsOnstage", variation: OTKVariation.ATTEMPT });
    var data = this.state.data;
    //OT.properties.apiUrl = OT.properties.apiURLSSL = "https://anvil-preview.tokbox.com";
    this.hostSession = OT.initSession(data.apiKey, data.sessionIdHost);
    this.hostSession.on('signal:videoOnOff', this.videoOnOff);
    this.hostSession.on('signal:muteAudio', this.muteAudio);
    this.hostSession.on('signal:privateCall', this.onPrivateCall);
    this.hostSession.on('signal:endPrivateCall', this.endPrivateCall);
    this.hostSession.on('streamCreated', this.onStageStreamCreated);
    this.hostSession.on('streamDestroyed', this.onStageStreamDestroyed);
    this.hostSession.on('signal:disconnect', this.disconnectFromHost);
    this.hostSession.on('signal:startEvent', this.onStartEvent);
    this.hostSession.on('signal:goLive', this.goLive);
    this.hostSession.on('signal:finishEvent', this.finishEventShow);
    this.hostSession.on('sessionDisconnected', this.onStageDisconnected);
    this.hostSession.connect(data.tokenHost, this.onStageConnected);
  },


  connectionDropped: function (){
    this.lostConnectionWarning.show();
    // clean streambox and show ended message
    $('#userBox, #fanBox, #celebrityBox, #hostBox, #userBoxWrap').hide();
    this.setState({connectedToHost: false, connectionError:true, hostStream:null, celebrityStream:null, fanStream:null});
  },

  finishEventShow: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      //Close any swal message opened
      swal.close();

      if (this.state.connectedToHost) {
        this.setState({ connectedToHost: false, inLine: false, inCallStatus:null });
      }

      this.stopNetworkTest();

      // event has ended
      this.logEvent({ action: "FanDisconnectsOnstage", variation: OTKVariation.ATTEMPT });

      this.cleanUpSession(this.hostSession, this.publisher);
      if(this.publisher) {
        this.publisher.off();
        this.publisher.disconnect();
        this.publisher.destroy();
      }

      // clean streambox and show ended message
      $('#userBox, #fanBox, #celebrityBox, #hostBox, #userBoxWrap').hide();

      // show ended message
      var _event = this.state.event;
      _event['status'] = 'C';
      this.setState({event: _event, connectedToHost: false});

      // show end event image if exist
      var event_image = _event.event_image_end || _event.event_image || "/img/TAB_VIDEO_PREVIEW_LS.jpg";
      $('#event-image').attr('src', event_image);

      if (!_.isEmpty(_event.redirect_url)) {
        if (this.inEmbedWidget())
          window.top.location = _event.redirect_url;
        else
          window.location = _event.redirect_url;
      }
    }
  },

  inEmbedWidget: function () {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  },

  videoOnOff: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var data = utils.jsonParse(event.data);
      if (data.video === 'on') {
        this.publisher.publishVideo(true);
      } else {
        this.publisher.publishVideo(false);
      }
    }
  },

  muteAudio: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var data = utils.jsonParse(event.data);
      if(data.mute === 'on') {
        this.publisher.publishAudio(false);
      } else {
        this.publisher.publishAudio(true);
      }
    }
  },

  disconnectFromHost: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var _this = this;
      this.setState({ connectedToHost: false, kicked: true, inLine: false , inCallStatus:null, minimized:false });
      if (this.publisher) {
        this.logEvent({ action: "FanUnpublishOnstage", variation: OTKVariation.ATTEMPT });
        this.hostSession.unpublish(this.publisher);
      }
      //this.blockPresence();
      this.showThankYouToast();
      this.onLeaveLineClick();
      this.disableVideoAudio();
      this.socket.emit('disconnect', _this.state.data.sessionIdProducer);
    }
  },

  /** UTILITIES **/
  unsubscribeSelfSubscriber: function () {
    if(this.selfSubscriber) {
      this.producerSession.unsubscribe(this.selfSubscriber);
      this.selfSubscriber = null;
      //$('#video-publisher-hidden').remove();
    }
  },

  initQualityTest: function () {
    var bIsEventLive = this.isEventLive() || this.isUserOnstage();
    var _subscribers = this.state.subscribers;
    var _this = this;
    var session;
    if(bIsEventLive && _subscribers['host'] && _subscribers['host'].stream.hasVideo) {
        this.unsubscribeSelfSubscriber();
        this.performQualityTest(_subscribers['host']);
    } else if(bIsEventLive && _subscribers['celebrity'] && _subscribers['celebrity'].stream.hasVideo) {
        this.unsubscribeSelfSubscriber();
        this.performQualityTest(_subscribers['celebrity']);
    } else {
        if(this.selfSubscriber) {
          this.performQualityTest(this.selfSubscriber);
        } else {
          session = this.state.connectedToHost ? this.hostSession : this.producerSession;

          this.selfSubscriber = session.subscribe(
            this.publisher.stream,
            'video-publisher-hidden',
            {
              audioVolume: 0,
              testNetwork: true,
              insertMode: 'append'
            },
            _this.onSelfSubscribe
          );
        }
    }
  },

  startNetworkTest: function() {
    var _this = this;
    this.unsubscribeSelfSubscriber();
    this.initQualityTest();
    this.testNetworkIntervalId = setInterval(function(){
      _this.initQualityTest();
    }, 15000);
  },

  stopNetworkTest: function() {
    window.clearInterval(this.testNetworkIntervalId);
  },

  performQualityTest: function (subscriber) {
    var networkTest = new NetworkTest();
    var _this = this;
    if(subscriber && subscriber.stream && subscriber.stream.hasVideo) {
      networkTest.performQualityTest({subscriber: subscriber}, function(error, results) {
        if(error) {
            console.log(error);
            return;
        }
        if(_this.producerSession && _this.publisher) {
          _this.sendQualityUpdate(results);
        }

      });
    } else {
      //If the stream hasn't video we send 'Poor' to producer.
      setTimeout(function() {
        if(_this.producerSession && _this.publisher) {
          _this.sendQualityUpdate(1);
        }
      }, 15000);

    }
  },

  sendQualityUpdate: function(quality) {
    var _this = this;
    if(quality === 5) {
      quality = 'Great';
    } else if(quality >= 3) {
      quality = 'Good';
    } else {
      quality = 'Poor';
    }
    var message = {
      data: JSON.stringify({
        connectionId: this.backstageConnectionId,
        quality: quality
      }),
      type: 'qualityUpdate'
    };
    this.producerSession.signal(message);
  },

  /** DUPLICATE PREVENTION **/
  setLocalStorage: function(key, value) {
    localStorage[key] = value;
  },

  getLocalStorage: function(key) {
    return localStorage[key];
  },

  removeItem: function(key) {
    localStorage.remoteItem(key);
  },

  forgetPresence: function() {
    var url = this.props.elem.getAttribute('url');
    var key = ['cs', url, 'presence'].join();
    var old = this.getLocalStorage(key) || '0';
    this.setLocalStorage(key, parseInt(old) - 1);
  },

  /** Call this one when the fan is kicked so he won't be able to join again **/
  blockPresence: function() {
    var url = this.props.elem.getAttribute("url");
    this.setLocalStorage(['cs', url, 'block'].join(), 'true');
  },

  isBlocked: function() {
    var url = this.props.elem.getAttribute("url");
    var blocked = this.getLocalStorage(['cs', url, 'block'].join());
    return blocked === 'true';
  },

  createMiniSnapshot: function() {
    var _this = this;
    var imgData = this.publisher.getImgData();
    var img = document.createElement('img');
    img.src = ['data:image/png;base64,', imgData].join('');
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = 60;
      canvas.height = 60;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      _this.saveMiniSnapshot(canvas.toDataURL());
    };
  },

  saveMiniSnapshot: function(snapshot){
    this.snapshot = snapshot;
  },

  /** CALLBACKS **/


  onProducerLeaving: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      this.setState({ newFanSignalAckd: false });
    }
  },

  onStartEvent: function(event) {
    var _event = this.state.event;
    if(_event) {
      if(_event['status'] == 'N') {
        _event['status'] = 'P';
        this.setState({ event: _event });
      }
    }
    //Reset the newFanSignalAckd when the admins enter
    this.setState({ newFanSignalAckd: false });
  },

  onConnectedToBackstageSession: function(error) {
    if (error) return this.onConnectError(error);
    this.logEvent({ action: "FanConnectsBackstage", variation: OTKVariation.SUCCESS });
    this.logEvent({ action: "FanPublishesBackstage", variation: OTKVariation.ATTEMPT });
    this.producerSession.publish(this.publisher, this.onPublishCompleted);
  },

  onSessionDataReceived: function(results) {
    results = typeof(results) === 'string' ? JSON.parse(results) : results;
    this.setState({data: results, event: results.event});
    if(results.event.status !== 'C') {
      this.startLoggingEngine();
      this.connectToOnStage();
    }
  },

  onPublishCompleted: function(error) {
    var fanState = this.state.fanState;
    this.logEvent({ action: "FanPublishesBackstage", variation: error ? OTKVariation.FAILURE : OTKVariation.SUCCESS });
    if(!fanState.connectedToOnstageSession || (this.isEventLive() && (fanState.subscribingHost === false || fanState.subscribingCelebrity === false))) {
      this.sendWarningSignal();
    }
  },

  onOnstagePublishCompleted: function(error) {
    this.logEvent({ action: "FanPublishesOnstage", variation: error ? OTKVariation.FAILURE : OTKVariation.SUCCESS });
  },

  onStreamDestroyed: function(event) {
    var producerStream = this.state.producerStream;
    if (producerStream !== null &&
        producerStream.connection.connectionId === event.stream.connection.connectionId &&
        event.stream.connection.data === 'usertype=producer') {
      this.setState({producerStream: null});
    }
  },

  onStreamCreated: function(event) {
    if(this.state.producerStream === null && event.stream.connection.data === 'usertype=producer') {
      this.setState({producerStream: event.stream});
    }
  },

  onStageStreamCreated: function (event) {
    var _event = this.state.event;
    var boxId = '';
    var userType = '';

    switch (event.stream.connection.data) {
      case 'usertype=celebrity':
        if(this.state.celebrityStream === null) {
          this.setState({celebrityStream: event.stream});
          boxId = 'celebrityBox';
          userType = 'celebrity';
        }
        break;
      case 'usertype=host':
        if(this.state.hostStream === null) {
          this.setState({hostStream: event.stream});
          boxId = 'hostBox';
          userType = 'host';
        }
        break;
      case 'usertype=fan':
        this.setState({fanStream: event.stream});
        boxId = 'fanBox';
        userType = 'fan';
        break;
      case 'usertype=producer':
        if(this.state.privateProducerStream === null) {
          this.setState({privateProducerStream: event.stream});
          userType = 'producer';
        }
        break;
    }
    if(boxId !== '' && (_event.status === 'L' || !this.state.subscribeToAudio || this.isUserOnstage()) && userType !== "producer") {
      var _subscribers = this.state.subscribers;
      _subscribers[userType] = this.subscribeStageUser(event.stream, boxId);
      if((userType === 'host' || userType === 'celebrity') && !this.state.subscribeToAudio) {
        _subscribers[userType].subscribeToAudio(false);
      }
      this.setState({"subscribers":_subscribers});
    }
  },

  onStageStreamDestroyed: function (event) {
    var _subscribers = this.state.subscribers;

    switch (event.stream.connection.data) {
      case 'usertype=celebrity':
        if(this.state.celebrityStream !== null && this.state.celebrityStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({celebrityStream: null});
          _subscribers["celebrity"] = null;
        }
        break;
      case 'usertype=host':
        if(this.state.hostStream !== null && this.state.hostStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({hostStream: null});
          _subscribers["host"] = null;
        }
        break;
      case 'usertype=fan':
        if(this.state.fanStream !== null && this.state.fanStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({fanStream: null});
          _subscribers["fan"] = null;
        }
        break;
      case 'usertype=producer':
        if(this.state.privateProducerStream !== null && this.state.privateProducerStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({privateProducerStream: null});
          this.endPrivateCall();
        }
        break;
    }
    this.setState({"subscribers":_subscribers});
  },

  onStageConnected: function (error) {
    if (error) return this.onStageConnectError(error);
    this.setFanState("connectedToOnstageSession", true);
    this.logEvent({ action: "FanConnectsOnstage", variation: OTKVariation.SUCCESS });
    var autoGetInLine = function(){
        return window.location.search === '?autogetinline=1';
    };

    var hasToken = function() {
        return window.location.search.indexOf('t=') !== -1;
    };

    if( autoGetInLine() || hasToken() ) {
      this.attemptGetInLine();
    }

  },

  onStageDisconnected: function (event) {
    this.logEvent({ action: "FanDisconnectsOnstage", variation: OTKVariation.SUCCESS });
    if(event.reason === 'networkDisconnected') {
      //double check this, not sure this is where the fail should be
      this.logEvent({ action: "FanDisconnectsOnstage", variation: OTKVariation.FAILURE });
      this.setFanState("connectedToOnstageSession", false);
    }
  },

  onPublisherStreamDestroyed: function (event) {

    if(this.isUserOnstage()){
      this.logEvent({ action: "FanUnpublishesOnstage", variation: OTKVariation.SUCCESS });
    } else {
      this.logEvent({ action: "FanUnpublishesBackstage", variation: OTKVariation.SUCCESS });
    }
    if (event.reason === 'forceDisconnected') {
      this.onLeaveLineClick();
    } else {
      event.preventDefault();
    }

  },

  onPublisherStreamCreated: function (event) {
    if(event.target.session.id === this.state.data.sessionIdProducer) {
      this.backstageConnectionId = this.getConnectionId();
    }
    this.startNetworkTest();
  },

  onSelfSubscribe: function(event) {
    this.performQualityTest(this.selfSubscriber);
  },

  onSignalCompleted: function(error) {
    if (error) {
      console.log('onSignalCompleted:ERROR', error);
    } else {
      this.setState({ inLine: true, inCallStatus:"in_line"});
    }
  },

  onSendWarningSignal: function (error) {
    if (error) console.log('onSendWarningSignal:ERROR', error);
  },

  onAccessAllowed: function(event) {
    this.logEvent({ action: 'fanAcceptsCameraPermissions', variation: OTKVariation.SUCCESS });
    this.hidePermissionOverlay();
  },

  onAccessDenied: function(event) {
    this.logEvent({ action: 'fanAcceptsCameraPermissions', variation: OTKVariation.FAILURE });
    this.setState({ accessDenied: true });
  },

  onAccessDialogOpened: function(event) {
    this.logEvent({ action: 'fanAcceptsCameraPermissions', variation: OTKVariation.ATTEMPT });
  },


  /** ERROR HANDLERS **/
  onAjaxRequestError: function(error) {
    console.log('onAjaxRequestError:error', error);
  },

  onInitPublisherCompleted: function(error) {
    if (error) {
      console.log('onInitPublisherCompleted:error', error);
    } else {
      this.createMiniSnapshot();
    }
  },

  onConnectError: function(error) {
    this.logEvent({ action: "FanConnectsBackstage", variation: OTKVariation.FAILURE });
    if (error) console.log('onConnectError:error', error);
  },

  onStageConnectError: function(error) {
    if (error) {
      this.logEvent({ action: "FanConnectsOnstage", variation: OTKVariation.FAILURE });
      console.log('onConnectError:error', error);
      this.setFanState("connectedToOnstageSession", false);
    }
  },


  attemptGetInLine: function(event) {
    this.socket.emit('joinRoom', this.state.data.sessionIdProducer);
    //Check if is embed and chrome.
    if(this.inEmbedWidget() && this.isChrome() && this.state.data.http_support) {
      this.setState({newWindow:true});
      this.cleanUpSession(this.hostSession, this.publisher);
      if(this.publisher) {
        this.publisher.off();
        this.publisher.disconnect();
        this.publisher.destroy();
      }
      window.open(window.location.origin + window.location.pathname + '?autogetinline=1', "_blank");
      return;
    }

    if (!this.publisher) {
      var _streamOptions = $.extend({}, this.state.streamUIOptions);
      if( window.location.hash == "#fake" ){ $.extend(_streamOptions, { constraints: { fake: true, video: true, audio: true } }) }
      this.initPublisher('userBox', _streamOptions);
    }
    if (!_.isEmpty(this.state.userName)) this.onGetInLineClick();
    setTimeout(function() { this.setState({ attemptInLine: true }); }.bind(this), 100);
  },

  initPublisher: function (divId, options) {
    this.publisher && this.publisher.destroy();
    this.publisher = this.props.OT.initPublisher(divId, options, this.onInitPublisherCompleted);
    this.publisher.on('accessAllowed', this.onAccessAllowed);
    this.publisher.on('accessDenied', this.onAccessDenied);
    this.publisher.on('accessDialogOpened', this.onAccessDialogOpened);
    this.publisher.on('streamDestroyed', this.onPublisherStreamDestroyed);
    this.publisher.on('streamCreated', this.onPublisherStreamCreated);
    return this.publisher;
  },

  isChrome: function () {
    return this.props.fingerprint_data.browser === 'Chrome';
  },

  onGetInLineClick: function(event) {
    var data = this.state.data;
    this.setState({ minimized: false, connectedToBackstage: false });
    if (_.isEmpty(this.state.userName)) {
      this.setState({ userName: 'Anonymous' });
    }
    this.socket.emit('joinRoom', this.state.data.sessionIdProducer);
    this.connectToBackstageSession();
  },

  onLeaveLineClick:function() {
    var user = this.state.user;
    this.stopNetworkTest();
    this.logEvent({ action: "FanDisconnectsBackstage", variation: OTKVariation.ATTEMPT });
    this.cleanUpSession(this.producerSession, this.publisher);
    if(this.publisher) {
      this.publisher.destroy();
      this.publisher = null;
    }
    this.resetFanState();
    if (user.chat) {
      user.chat.chatClosed = true;
      user.chat.chatting = false;
    }
    this.setState({ user:user, leftLine: true, inCallStatus:null, connectedToHost: false, newFanSignalAckd: false });
  },

  /** **/
  resetFanState: function() {
    this.setState({ inLine: false, attemptInLine: false });
  },

  /** EVENT HANDLERS **/
  handleClick: function(event) {
    this.onGetInLineClick(event);
    event.preventDefault();
    return false;
  },

  handleInputChange: function (name, e) {
    var change = {};
    change[name] = e.target.value;
    this.setState(change);
  },

  mirrorOnOff: function(event) {
    event.preventDefault();
    var userVideo = this.state.userVideo;
    userVideo.mirrored = !userVideo.mirrored;
    this.setState({userVideo: userVideo});
  },

  /***... CHAT BOX......***/
  changeUserState: function(options) {
    this.setState({user:options});
  },

  sendMessage: function(options) {
    if (_.isEmpty(options.message.trim())) return;
    var message = {
      to: options.to,
      data: JSON.stringify({
        message:{
          message: options.message
        }
      }),
      type: 'chatMessage'
    };
    this.prevMessage = { message: options.message };
    this.producerSession.signal(message, this.handleMessageSent);
  },

  handleMessageSent: function(error){
    if (error) {
      console.log('handleMessageSent:ERROR', error);
    } else {
      this.addMessageToUser(this.prevMessage);
    }
  },

  handleNewMessage: function(event){
    if (event.from && event.from.data === 'usertype=producer'){
      var user = this.state.user;
      var data = utils.jsonParse(event.data);
      user.chat.chatting = true;
      user.chat.chatClosed = false;
      user.chat.producerTo = event.from;
      data.message.to = { connectionId : event.from.connectionId};
      user.chat.messages.push(data.message);
      this.setState({user:user});
    }
  },

  closeChat: function(event){
    if (event.from && event.from.data === 'usertype=producer') {
      var user = this.state.user;
      var message = {
        to: event.target.connection,
        message: '-- This chat was closed by the producer -- '
      };
      user.chat.chatClosed = true;
      user.chat.messages.push(message);
      user.chat.chatting = true;
      this.setState({user:user});
    }
  },

  updateScroll: function() {
    this.refs.chatFooter.updateScroll();
  },

  getConnectionId: function () {
    return (this.publisher && this.publisher.stream ? this.publisher.stream.connection.connectionId : '');
  },

  addMessageToUser: function(message){
    if (_.isEmpty(message)) return;
    var user = this.state.user;
    message.to = {connectionId : this.getConnectionId()};
    user.chat.messages.push(message);
    this.setState({user:user});
  },

  usernameEntered: function(e) {
    if (e.keyCode === 13) {
      this.onGetInLineClick();
      e.preventDefault();
      e.stopPropagation();
    }
  },

  changeEventStatus: function(newStatus) {
    var show = this.state.event;
    show.status = newStatus;
    this.setStatus({ event: show });
  },

  displayableStatus: function() {
    var statuses = {
      "P": "Not started",
      "L": "Live",
      "C": "Closed"
    };
    return statuses[this.state.event.status];
  },

  shouldRenderElements: function() {
    return !this.isBlocked() && !this.state.newWindow && this.state.ableToJoin;
  },

  shouldShowLeaveLineButton: function() {
    return this.shouldRenderElements() &&
      (this.state.inLine  || this.state.attemptInLine) &&
      (this.state.inCallStatus != "on_stage");
  },

  shouldShowGetInLineButton: function() {
    return this.shouldRenderElements() && !this.state.attemptInLine;
  },

  shouldAskForName: function() {
    return this.state.attemptInLine && _.isEmpty(this.state.userName) &&
      this.state.accessAllowed && !this.state.inLine;
  },

  shouldAskForPermissions: function() {
    return this.state.attemptInLine && !this.state.accessAllowed && this.publisher;
  },

  shouldHidePublisher: function() {
    return !this.shouldRenderElements() || !this.state.attemptInLine || this.isUserOnstage();
  },

  mustStream: function() {
    return ['backstage', 'on_stage', 'on_producer_call'].indexOf(this.state.inCallStatus) >= 0;
  },

  isUserOnstage: function() {
    return this.state.connectedToHost;
  },

  /** EVENT STATES **/
  isEventLive: function() {
    return this.state.event.status === 'L' || !this.state.subscribeToAudio;
  },
  isEventOver: function() {
    return this.state.event.status === 'C';
  },
  isEventNotStarted: function() {
    return this.state.event.status === 'N';
  },
  isEvenInPreshow: function() {
    return this.isEventNotStarted() && this.state.event.status === 'P';
  },

  deniedPermissions: function() {
    return this.state.attemptInLine && this.state.accessDenied;
  },

  buildButton: function(onClick, cssClassButton, cssClassIcon, text) {
    if(!this.state.subscribeToAudio) return;
    return (
      <a className={cssClassButton} onClick={onClick}>
        <i className={cssClassIcon}></i>
        {text}
      </a>
    );
  },

  noop: function() {},

  askForName: function() {
    var _this = this;
    swal(
      {
        title: 'Almost done!',
        text: 'You may enter you name below.',
        type: 'input',
        closeOnConfirm: false,
        inputPlaceholder: 'Name (Optional)',
        allowEscapeKey: false,
        html: true,
        confirmButtonColor: '#00a3e3',
      },
      function(inputValue) {
        _this.setState({ userName: inputValue });
        _this.onGetInLineClick();
        swal.close();
      }
    );
  },

  showThankYouToast: function() {
    var _this = this;
    this.refs.container.success(
      'Thank you for participating, you are no longer sharing video/voice. You can continue to watch the session at your leisure.',
      null,
      {
        tapToDismiss: true,
        closeButton: true,
        showAnimation: 'animated fadeInDown',
        hideAnimation: 'animated fadeOutUp',
        clearAlert: function() {
          _this.refs.container.clear();
        }
      }
    );
  },
  renderFooter: function() {
    if (this.isEventOver() || !this.shouldRenderElements()) return null;

    if (_.isEmpty(this.state.user)) {
      return React.createElement("div")
    } else {
      return React.createElement(ChatFooter,{ ref: 'chatFooter', send_message:this.sendMessage, change_event:this.changeUserState, user:this.state.user });
    }
  },

  renderActionButton: function() {
    if (!this.shouldRenderElements()) return null;
    var action = this.noop;
    var iClass = '';
    var btnClass;
    var btnText;

    switch(this.state.event.status) {
      case 'P':
      case 'L':
        if (this.shouldShowLeaveLineButton()) {
          action = this.onLeaveLineClick;
          btnText = this.props.leaveLineText;
          btnClass = 'btn btn-fan-action ' + this.props.leaveLineBtnClass;
          iClass = 'fa fa-times';
        } else if (this.shouldShowGetInLineButton()) {
          action = this.attemptGetInLine;
          btnText = this.props.getInLineText;
          btnClass = 'btn btn-fan-action ' + this.props.getInLineBtnClass;
          iClass = 'fa fa-check-circle-o';
        } else return;
        break;
      case 'N':
        btnText = 'This event has not started yet.'
        btnClass = this.props.unstartedBtnClass;
        break;
      case 'C':
        btnText = 'This event is over';
        btnClass = this.props.eventOverBtnClass;
        break;
    }

    if (!_.isEmpty(btnText))
      return this.buildButton(action, btnClass, iClass, btnText);
    return null;
  },

  renderPermissionDeniedOverlay: function() {
    var html = [
      "Please allow access to your camera <br/> and microphone to continue.<br/>"+
      "Click the camera icon in your browser bar <br/> to view the permissions dialog."
    ].join('<br/>');
    swal({
      title: "Aw, what happened?",
      customClass:"camera-error",
      text: html,
      type: "error",
      html: true
    });
  },

  renderPermissionRequestOverlay: function() {
    swal({
      title: "<div style='color: #3dbfd9'>Hi There!</div>",
      text: '<h4>Please allow access to your camera <br/> and microphone to continue.</h4>',
      html: true,
      timer: 999999,
      showConfirmButton: false
    });
  },

  renderOverlay: function() {
    if (!this.shouldRenderElements()) return;

    if (this.shouldAskForName()) {
      this.askForName();
    } else if (this.deniedPermissions()) {
      this.renderPermissionDeniedOverlay();
    } else if (this.shouldAskForPermissions()) {
      this.renderPermissionRequestOverlay();
    }
  },

  renderPanelBody: function(streamCount) {
    var event = this.state.event;
    var isUserOnstage = this.isUserOnstage();
    var showStreams = this.isEventLive() || isUserOnstage;
    var xsColClass = ['col-xs-', 12 / streamCount].join('');
    var videoWrapClass = ['videoWrap', this.state.userVideo.mirrored ? 'allowMirror' : 'removeMirror'].join(' ');
    var mirrorIconClass = this.state.userVideo.mirrored ? 'fa fa-exchange color5' : 'fa fa-exchange';
    var isArchiving = (isUserOnstage && event.archive_event && event.status == 'L');
    var panelClass = "panel-body";
    switch(streamCount) {
      case 1: panelClass += " streams-1";
              break;
      case 2: panelClass += " streams-2";
              break;
      case 3: panelClass += " streams-3";
              break;
    }
    var event_image = this.isEventOver() ? event.event_image_end : event.event_image;
    if(!event_image) event_image = '/img/TAB_VIDEO_PREVIEW_LS.jpg';
    return (
      <div className={panelClass}>
        <div className={!(this.state.hostStream && showStreams ) ? "hide" : xsColClass}>
            <div className="videoWrap">
              <div className="video-window" id="hostBox"></div>
            </div>
        </div>
        <div className={!(this.state.celebrityStream && showStreams) ? "hide" : xsColClass}>
          <div className="videoWrap">
            <div className="video-window" id="celebrityBox"></div>
          </div>
        </div>
        <div className={((this.state.fanStream && this.isEventLive()) || isUserOnstage) ? xsColClass : "hide"}>
          <div className={videoWrapClass} style={{marginLeft:'-1px'}}>
            <div className="video-window" id="fanBox"></div>
            { !this.state.fanStream && <a className="btn-mirror" href="#" onClick={this.mirrorOnOff}><i className={mirrorIconClass}></i></a> }
          </div>
        </div>
        <div className={streamCount != 0 ? "hide" :"preshow-image-window"}>
            <img id="event-image" className="preshow-image" src={event_image} />
        </div>
        <div id="userBoxWrap" className={this.shouldHidePublisher() ? 'hide' : (this.state.minimized ? 'window-wrap minimized' : 'window-wrap') }>
          <div className={this.mustStream() ? 'hide' : 'window-actions'}>
            <a href='javascript:;' onClick={this.disableVideoAudio}><i className="fa fa-minus minimize"></i></a>
            <a href='javascript:;' onClick={this.enableVideoAudio}><i className="fa fa-video-camera restore"></i></a>
          </div>

          <div id="userBox" className={this.state.minimized ?  "hide" : "small-video"}></div>
        </div>
        <div className={isArchiving ? "col-xs-12 col-sm-12 event-archiving" : "hide"}>
          <h3>
            <i className="fa fa-dot-circle-o"></i> Recording
          </h3>
        </div>
      </div>
    )
  },

  renderEventLoadingOverlay: function() {
    return (
      <div className="loading">
        <img src="/img/loading.gif" alt="loading-img" />
      </div>
    );
  },
  renderStatusLabel:function(){
    var label = null;
    switch (this.state.inCallStatus) {
      case 'in_line':
        label = (<div className="fan-status-large stat-lightBlue">You Are In Line</div>);
        break;
      case 'backstage':
        label = (<div className="fan-status-large stat-blue">You Are Backstage</div>);
        break;
      case 'on_stage':
        label = (<div className="fan-status-large stat-green">You Are On Stage</div>);
        break;
      case 'on_producer_call':
        label = (<div className="fan-status-large stat-red">You Are On Call With Producer</div>);
        break;
      case 'temporarilly_muted':
        label = (<div className="fan-status-large stat-red">Other participants are in a private call. They may not be able to hear you.</div>);
        break;
      case 'on_private_producer_call':
        label = (<div className="fan-status-large stat-red">You Are On Private Call With Producer</div>);
        break;
      }
    return label
  },
  render: function() {
    var event = this.state.event;

    if(!this.state.ableToJoin) {
      return React.createElement(FanErrorView, {
              event_image: this.props.elem.getAttribute("event_image"),
              event_name: this.props.elem.getAttribute("event_name"),
              key:'FanErrorView'});
    }

    if (!event) return this.renderEventLoadingOverlay();

    var chatFooter = this.renderFooter();
    var actionBtn = this.renderActionButton();
    var waitLabel;
    if(!this.state.subscribeToAudio) {
      waitLabel = <span className="hide-620 alternative-title">POST PRODUCTION</span>;
    } else {
      waitLabel = this.isEventNotStarted() ? <span className="hide-620">Waiting to start</span> : actionBtn;
    }
    var isUserOnstage = this.isUserOnstage();
    var isEventLive = this.isEventLive();
    var statusLabel = this.isEventOver() ? null : this.renderStatusLabel();
    var streams = (isEventLive || isUserOnstage) ? _.compact([this.state.hostStream,this.state.celebrityStream,this.state.fanStream]).length : 0;
    var toastContainer = React.createElement(
      ToastContainer,
      { ref: 'container', toastMessageFactory: ToastMessageFactory, className: 'toast-top-right' }
    );
    var panelBody;

    if(isUserOnstage) streams++;
    panelBody = this.renderPanelBody(streams);

    this.renderOverlay();

    return (
      <Wrapper>

        {toastContainer}
        <div className={ streams > 2 ? "container-fluid" : "container" }>
          <div className="row">

            <div className={(isEventLive || isUserOnstage) ? "col-xs-12" : "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1"}>
              <div className={(isEventLive || isUserOnstage) ? "panel panel-default fan-live-panel fan-live-full" : "panel panel-default fan-live-panel"}>

                <div className="panel-title">
                  <h4>{event.event_name} <sup>{this.displayableStatus()}</sup></h4>

                  <ul className="panel-tools">
                    <li>
                      {waitLabel}
                    </li>
                  </ul>
                </div>

                <div className="panel-search">
                  <form>
                    <input type="text" className="form-control" placeholder="Search on this panel...">
                      <i className="fa fa-search icon"> </i>
                    </input>
                  </form>
                </div>
                {statusLabel}
                {panelBody}
              </div>
            </div>

          </div>
        </div>
        {chatFooter}
        <div className="hide" id="prodBox"></div>
        <div className="hide" id="video-publisher-hidden"></div>
      </Wrapper>
    );
  }
});

module.exports = App;
