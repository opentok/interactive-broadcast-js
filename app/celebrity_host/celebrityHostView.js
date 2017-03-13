/** @jsx React.DOM */
var AjaxHandler = require('./../common/ajax-handler');
var LostConnectionWarning = require('./../common/lostConnectionWarning');
var React       = require("react");
var $           = require('jquery');
var Wrapper     = require('../fan/partials/wrapper');
var ChatFooter  = require('../common/single_user_chat');
var utils       = require('../utils/utils');
var _           = require('underscore');
var camelize = require("underscore.string/camelize");
var ReactToastr         = require('react-toastr');
var ToastContainer      = ReactToastr.ToastContainer;
var Analytics             = require('opentok-solutions-logging');
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

var OTKVariation = {
  SUCCESS:"Success",
  ATTEMPT:"Attempt",
  FAILURE:"Fail"
};

var CelebrityHostView = React.createClass({

  getInitialState: function() {
    return {
      data: '',
      fanStream: null,
      hostStream:null,
      celebrityStream:null,
      producerStream:null,
      producerSubscriber:null,
      publishOnly:false,
      streamUIOptions: {
        showControls: false,
        width: "100%",
        height: "100%",
        insertMode: 'append',
        fitMode: 'contain'
      },
      height:0,
      user: {
        chat: {
          chatting: false,
          messages: []
        }
      },
      userVideo: {
        mirrored: true
      },
      subscribedStreams : {},
      inCallStatus:null,
      connectionError: false
    };
  },

  componentDidMount: function() {
    this.lostConnectionWarning = new LostConnectionWarning();
    this.stopGoingLive = false;
    this.ajaxHandler = new AjaxHandler();
    this.ajaxHandler.getRequest(
      this.props.source,
      this.onSessionDataReceived,
      this.onAjaxRequestError
    );
    window.addEventListener("resize", this.updateDimensions);
    OT.on('exception', this.onOTException);
  },
  updateDimensions:function(){
    this.setState({height: $(window).height() - 150});
  },
  componentWillUnmount: function() {
    window.removeEventListener("resize", this.updateDimensions);
  },
  componentWillMount: function() {
    this.updateDimensions();
  },
  initPublisher: function() {
    if(this.state.data.event.status !== 'P' && this.state.data.event.status !== 'L') return;
    this.publisher = OT.initPublisher(this.props.boxId, this.state.streamUIOptions, this.onInitPublisherCompleted);
    this.publisher.on('streamDestroyed', this.onPublisherStreamDestroyed);
    this.publisher.on('streamCreated', this.onPublisherStreamCreated);
    this.publisher.on('accessAllowed', this.onAccessAllowed);
    this.publisher.on('accessDenied', this.onAccessDenied);
    this.publisher.on('accessDialogOpened', this.onAccessDialogOpened);
  },
  startLoggingEngine:function(){
    var event = this.state.data.event;
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
    var usertype = this.getUserType() === 'host' ? 'host' : 'celebrity';
    var action = camelize("_"+[usertype, action].join('_'));
    if(this.OTKlogging) this.OTKlogging.logEvent({ action: action , variation: variation });
  },

  getUserType:function(){
    return this.props.boxId == "celebrityBox" ? "CELEBRITY" : "HOST"
  },
  showCountdown: function(count) {
    if(this.stopGoingLive) return;
    swal({
      title: '<h5>GOING LIVE IN</h5>',
      text: ['<h1 class="count-down">', count, '</h1>'].join(''),
      showConfirmButton: false,
      html: true
    });
  },

  startCountdown: function(){
    if(this.stopGoingLive) return;
    var _this = this;
    var initialValue = 5;
    var updateCountdown = function() {
      var count = _this.state.countback || initialValue;
      _this.setState({ countback: count - 1 });
    };

    this.counter = setInterval(function(){
      updateCountdown();
      if (_this.state.countback <= 0) {
        clearInterval(_this.counter);
        swal.close();
        this.stopGoingLive = true;
        _this.counter = null;
      } else {
        _this.showCountdown(_this.state.countback);
      }
    }, 1000);

    this.showCountdown(initialValue);
  },
  goLive: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      this.endPrivateCall();
      this.startCountdown();
      var _data = this.state.data;
      _data.event['status'] = 'L';
      this.setState({data: _data});
    }
  },

  startOnStageSession: function() {
    var data = this.state.data;
    this.logEvent('ConnectsOnstage', 'attempt');
    //OT.properties.apiUrl = OT.properties.apiURLSSL = "https://anvil-preview.tokbox.com";
    this.stageSession = OT.initSession(data.apiKey, data.sessionIdHost);
    this.stageSession.on('streamDestroyed', this.onStreamDestroyed);
    this.stageSession.on('streamCreated', this.onStreamCreated);
    this.stageSession.on('signal:videoOnOff', this.videoOnOff);
    this.stageSession.on('signal:muteAudio', this.muteAudio);
    this.stageSession.on('signal:changeVolumen', this.onChangeVolumen);
    this.stageSession.on('signal:chatMessage', this.handleNewMessage);
    this.stageSession.on('signal:privateCall', this.onPrivateCall);
    this.stageSession.on('signal:endPrivateCall', this.endPrivateCall);
    this.stageSession.on('signal:openChat', this.handleOpenChat);
    this.stageSession.on('signal:newBackstageFan', this.handleNewBackstageFan);
    this.stageSession.on('signal:goLive', this.goLive);
    this.stageSession.on('signal:finishEvent', this.finishEventShow);
    this.stageSession.on('signal:sessionDisconnected', this.onSessionDisconnected);
    this.stageSession.connect(data.tokenHost, this.onSessionConnectCompleted);

    //create chat window
    var user = {
      chat: {
        chatting: false,
        messages: []
      }
    };
    this.setState({user: user});
  },

  handleNewBackstageFan: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var _this = this;
      this.refs.toastContainer.info(
        'A new FAN has been moved to backstage',
        'Info',
        {
          tapToDismiss: true,
          closeButton: true,
          showAnimation: 'animated fadeInDown',
          hideAnimation: 'animated fadeOutUp',
          clearAlert: function() {
            _this.refs.toastContainer.clear();
          }
        }
        );
      }
  },

  handleOpenChat: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var user = this.state.user;
      user.chat.chatting = true;
      user.chat.chatClosed = false;
      user.chat.producerTo = event.from;
      this.setState({user:user});
    }
  },

  onPrivateCall:function(event){
    if (event.from && event.from.data === 'usertype=producer') {
      var data = utils.jsonParse(event.data);
      if(this.publisher.stream.connection.connectionId === data.callWith){
        var options = this.state.streamUIOptions;
        options.subscribeToVideo = false;
        var producerSubscriber = this.stageSession.subscribe(this.state.producerStream, 'prodBox',options);
        this.setState({"producerSubscriber":producerSubscriber,inCallStatus:"on_private_producer_call"});
      } else{
        this.setState({inCallStatus:"temporarilly_muted"});
      }
      this.muteOnstageFeeds(true);
    }
  },
  endPrivateCall:function(event){
    if (event && event.from && event.from.data !== 'usertype=producer') return;
    if(this.state.producerSubscriber){
      this.stageSession.unsubscribe(this.state.producerSubscriber);
      this.setState({"producerSubscriber":null});
    }
    this.setState({inCallStatus:null});
    this.muteOnstageFeeds(false);
  },
  subscribeToProducer:function(stream){

  },
  muteOnstageFeeds:function(mute){
    var vol = mute? 0 : 100;
    _.each(this.state.subscribedStreams,function(subscriber){
        if(subscriber !== null) subscriber.setAudioVolume(vol);
    });
  },

  handleNewMessage: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
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

  forceDisconnect: function () {
    if(!this.stopGoingLive);
    this.stopGoingLive = true;
    clearInterval(this.counter);
    this.cleanUpSession(this.stageSession, this.publisher);
    if(this.publisher) {
      this.publisher.off();
      this.publisher.disconnect();
      this.publisher.destroy();
    }
    swal({
      title: ["<div style='color: #3dbfd9'>There already is a ", (this.props.boxId == "hostBox") ? "host" : "celebrity" ," using this url.</div>"].join(''),
      text: '<h4>If this is you please close all browsers sessions and try again.</h4>',
      html: true,
      timer: 999999,
      showConfirmButton: false
    });
  },

  connectionDropped: function (){
    this.lostConnectionWarning.show();
    // event has ended
    this.cleanUpSession(this.stageSession, this.publisher);
    if(this.publisher) {
      this.publisher.off();
      this.publisher.disconnect();
      this.publisher.destroy();
      this.logEvent('disconnects_onstage', OTKVariation.SUCCESS);
    }
    // clean streambox and show ended message
    $('#userBox, #fanBox, #celebrityBox, #hostBox').hide();

    this.setState({connectionError:true, hostStream:null, celebrityStream:null, fanStream:null});
  },

  /** CALLBACKS **/

  onSessionDisconnected: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      if(event.reason === 'networkDisconnected') {
        this.connectionDropped();
      }
    }
  },

  onOTException: function(evt) {
    if(evt.code == 1553 || evt.code == 1554 || evt.code == 1006) {
      this.connectionDropped();
    }
  },

  onPublisherStreamDestroyed: function(event) {
    if(event.reason != 'forceDisconnected') {
        event.preventDefault();
    } else {
        this.forceDisconnect();
    }
  },

  onPublisherStreamCreated: function(event) {

    //if(this.state.data.event.status == 'P' || this.state.data.event.status == 'L') {
      //var div = $("#userBox > div");
      //$("#"+this.props.boxId).html(div);
    //}

    if(this.state.data.event.status == 'L' && !this.counter){
      this.startCountdown();
    }
  },

  onAccessAllowed: function(event) {
    this.logEvent('accepts_camera_permissions', OTKVariation.SUCCESS);
  },

  onAccessDenied: function(event) {
    this.logEvent('accepts_camera_permissions', OTKVariation.FAILURE);
  },

  onAccessDialogOpened: function(event) {
    this.logEvent('accepts_camera_permissions', OTKVariation.ATTEMPT);
  },

  finishEventShow: function (event) {
    if (event.from && event.from.data === 'usertype=producer') {
      // event has ended
      this.cleanUpSession(this.stageSession, this.publisher);
      if(this.publisher) {
        this.publisher.off();
        this.publisher.disconnect();
        this.publisher.destroy();
      }
      // clean streambox and show ended message
      $('#userBox, #fanBox, #celebrityBox, #hostBox').hide();

      // show ended message
      var _data = this.state.data;
      _data.event['status'] = 'C';
      this.setState({data: _data});

      // show end event image if exist
      var event_image = _data.event.event_image_end || _data.event.event_image || "/img/TAB_VIDEO_PREVIEW_LS.jpg";
      $('#event-image').attr('src', event_image);

      // redirect if a redirect url exist
      if (!_.isEmpty(_data.event.redirect_url)) {
        window.location = _data.event.redirect_url;
      }
    }
  },

  cleanUpSession: function(session, publisher) {
    if (session) {
      if (publisher && !this.stopGoingLive) {
        session.unpublish(publisher);
      }
      session.off();
      session.disconnect();
    }
  },

  onChangeVolumen: function (event) {
      if (event.from && event.from.data === 'usertype=producer') {
        var data = utils.jsonParse(event.data);
        var stream = null;
        switch(data.feedType) {
          case 'fan':
              stream = this.state.fanStream;
              break;
          case 'celebrity':
              stream = this.state.celebrityStream;
              break;
          case 'host':
              stream = this.state.hostStream;
              break;
        }
        if(stream !== null) {
          var subscribers = this.stageSession.getSubscribersForStream(stream);
          for (var i = 0; i < subscribers.length; i++) {
              subscribers[i].setAudioVolume(data.audioVolume);
          }
        }
      }
    },

  onSessionDataReceived: function(results) {
    var results = JSON.parse(results);
    if (this.isMounted()) {
      this.setState({ data: results });
      this.startLoggingEngine();
      this.startOnStageSession();
    }
  },

  onInitPublisherCompleted: function(error) {
    if (error) {
      console.log('there was an error, we should let the user know', error);
    }
  },

  onSessionConnectCompleted: function(error) {
    var _this = this;
    if (error) {
      console.log(error);
    } else {
      this.logEvent('connects_onstage', OTKVariation.SUCCESS);
      this.initPublisher();
      if(_this.publisher && _this.stageSession && !_this.stopGoingLive) {
        _this.stageSession.publish(_this.publisher);
      }
    }
  },

  subscribeFan: function(stream) {
    var _this = this;
    var _subscribedStreams = this.state.subscribedStreams;
    this.logEvent('subscribes_fan', OTKVariation.ATTEMPT);
    _subscribedStreams["fan"] = this.stageSession.subscribe(stream, 'fanBox', this.state.streamUIOptions,function(error){
      if(error){
        _this.setState({fanStream:null});
        _this.logEvent('subscribes_fan', OTKVariation.FAILURE);
      }else{
        _this.logEvent('subscribes_fan', OTKVariation.SUCCESS);
      }
    });
    this.setState({subscribedStreams:_subscribedStreams});
  },

  subscribeCelebrity: function (stream) {
    var _this = this;
    var _subscribedStreams = this.state.subscribedStreams;
    this.logEvent('subscribes_celebrity', OTKVariation.ATTEMPT);
    if(this.props.boxId != "celebrityBox") {
      _subscribedStreams["celebrity"] = this.stageSession.subscribe(stream, 'celebrityBox', this.state.streamUIOptions,function(error){
        if(error){
          _this.logEvent('subscribes_celebrity', OTKVariation.FAILURE);
          _this.setState({celebrityStream:null});
        }else{
          _this.logEvent('subscribes_celebrity', OTKVariation.SUCCESS);
        }
      });
    }
    this.setState({subscribedStreams:_subscribedStreams});
  },

  subscribeHost: function (stream) {
    var _this = this;
    var _subscribedStreams = this.state.subscribedStreams;
    if(this.props.boxId != "hostBox") {
      _this.logEvent('subscribes_host', OTKVariation.ATTEMPT);
      _subscribedStreams["host"] = this.stageSession.subscribe(stream, 'hostBox', this.state.streamUIOptions,function(error){
        if(error){
          _this.logEvent('subscribes_host', OTKVariation.FAILURE);
          _this.setState({hostStream:null});
        }else{
          _this.logEvent('subscribes_host', OTKVariation.SUCCESS);

        }
      });
    }
    this.setState({subscribedStreams:_subscribedStreams});
  },

  onStreamCreated: function(event) {
    var _this = this;
    var publishOnly = this.state.publishOnly;
    switch(event.stream.connection.data) {
        case 'usertype=fan':
            if(this.state.fanStream === null) {
              this.setState({fanStream:event.stream});
              if(!publishOnly){
                this.subscribeFan(event.stream);
              }
            }
            break;
        case 'usertype=celebrity':
          if(this.props.boxId === 'celebrityBox' && !this.stopGoingLive) this.forceDisconnect();
          if(!publishOnly && this.state.celebrityStream === null){
            this.subscribeCelebrity(event.stream);
          }
          this.setState({celebrityStream:event.stream});
          break;
        case 'usertype=host':
          if(this.props.boxId === 'hostBox' && !this.stopGoingLive) this.forceDisconnect();
          if(!publishOnly && this.state.hostStream === null){
            this.subscribeHost(event.stream);
          }
          this.setState({hostStream:event.stream});
          break;
        case 'usertype=producer':
          if(this.state.producerStream === null) {
            this.setState({producerStream:event.stream});
          }
          break;
    }
  },

  onStreamDestroyed: function(event) {
    var _subscribedStreams = this.state.subscribedStreams;
    switch (event.stream.connection.data) {
      case 'usertype=celebrity':
        if(this.state.celebrityStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({celebrityStream: null});
          _subscribedStreams["celebrity"] = null;
        }
        break;
      case 'usertype=host':
        if(this.state.hostStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({hostStream: null});
          _subscribedStreams["host"] = null;
        }
        break;
      case 'usertype=fan':
        if(this.state.fanStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({fanStream: null});
          _subscribedStreams["fan"] = null;
        }
        break;
      case 'usertype=producer':
        if(this.state.producerStream.connection.connectionId == event.stream.connection.connectionId) {
          this.setState({producerStream:null});
          this.endPrivateCall();
        }
        break;
    }
    this.setState({subscribedStreams:_subscribedStreams});
  },

  onAjaxRequestError: function(error) {
    console.log(error);
  },

  videoOnOff: function(event) {
    if (event.from && event.from.data === 'usertype=producer') {
      var data = utils.jsonParse(event.data);
      if(data.video === 'on') {
        this.publisher.publishVideo(true);
      } else {
        this.publisher.publishVideo(false);
      }
    }
  },

  muteAudio: function(event) {
    if (event.from && event.from.data == 'usertype=producer') {
      var data = utils.jsonParse(event.data);
      if(data.mute === 'on') {
        this.publisher.publishAudio(false);
      } else {
        this.publisher.publishAudio(true);
      }
    }
  },

  /** EVENT STATES **/

  isEventNotStarted: function() {
    return this.state.data.event.status === 'N';
  },

  renderEventLoadingOverlay: function() {
    return (
      <div className="loading">
        <img src="/img/loading.gif" alt="loading-img" />
      </div>
    );
  },
  buildButton: function(text) {
    return (
      <a className="btn fan-status stat-red btn-block">
        <i></i>
        {text}
      </a>
    );
  },
  renderActionButton: function() {
    var btnText;
    switch(this.state.data.event.status) {
      case 'N':
        btnText = 'This event has not started yet.';
        break;
      case 'C':
        btnText = 'This event is over';
        break;
    }

    if (!_.isEmpty(btnText))
      return this.buildButton(btnText);
    return null;
  },
  isEventOver: function() {
    return this.state.data.event.status === 'C';
  },

  inPrivateCall: function () {
    return this.state.inCallStatus === 'on_private_producer_call';
  },

  renderStatusLabel:function(){
    var label = null;
    switch (this.state.inCallStatus) {
      case 'temporarilly_muted':
        label = (<div className="fan-status-large stat-red">Other participants are in a private call. They may not be able to hear you.</div>);
        break;
      case 'on_private_producer_call':
        label = (<div className="fan-status-large stat-red">You Are On Private Call With Producer</div>);
        break;
    }
    return label
  },
  renderPanelBody: function(streamCount) {
    var event = this.state.data.event;
    var xsColClass = ['col-xs-', 12 / streamCount].join('');
    var mirrorIconClass = this.state.userVideo.mirrored ? 'fa fa-exchange color5' : 'fa fa-exchange';
    var videoWrapClass = ['videoWrap', this.state.userVideo.mirrored ? 'allowMirror' : 'removeMirror'].join(' ');
    var isEventOpened = (this.state.data.event.status == 'P' || this.state.data.event.status == 'L') && !this.state.connectionError;
    var isArchiving = (event.archive_event && event.status == 'L' && !this.state.connectionError);
    var publishOnly = this.state.publishOnly;
    return (
      <div className="panel-body">
        <div className={(((!this.state.hostStream || publishOnly) && this.props.boxId != 'hostBox') || !isEventOpened) ? "hide" : xsColClass}>
            <div className={videoWrapClass}>
              <div className="video-window" id="hostBox"></div>
              { !this.state.hostStream && <a className="btn-mirror" href="#" onClick={this.mirrorOnOff}><i className={mirrorIconClass}></i></a> }
            </div>
        </div>
        <div className={(((!this.state.celebrityStream || publishOnly)  && this.props.boxId != 'celebrityBox')  || !isEventOpened) ? "hide" : xsColClass}>
            <div className={videoWrapClass}>
              <div className="video-window" id="celebrityBox"></div>
              { !this.state.celebrityStream && <a className="btn-mirror" href="#" onClick={this.mirrorOnOff}><i className={mirrorIconClass}></i></a> }
            </div>
        </div>
        <div className={(this.state.fanStream && isEventOpened && !publishOnly) ? xsColClass : "hide"}>
          <div className="videoWrap" style={{marginLeft:'-1px'}}>
            <div className="video-window" id="fanBox"></div>
          </div>
        </div>
        <div className={isEventOpened ? "hide" :"preshow-image-window"}>
            <img id="event-image" className="preshow-image" src={event.event_image || "/img/TAB_VIDEO_PREVIEW_LS.jpg"} />
        </div>
        <div id="userBox" className="hide"></div>
        <div className={isArchiving ? "col-xs-12 event-archiving" : "hide"} >
          <h3>
            <i className="fa fa-dot-circle-o"></i> Recording
          </h3>
        </div>
      </div>
    )
  },

   displayableStatus: function() {
    var statuses = {
      "P": "Preshow",
      "L": "Live",
      "C": "Closed"
    };
    return statuses[this.state.data.event.status];
  },

  sendMessage: function(options) {
    if (_.isEmpty(options.message.trim())) return;
    var message = {
      to: options.to,
      data: JSON.stringify({
        message:{
          message: options.message,
        }
      }),
      type: 'chatMessage'
    };
    this.prevMessage = { message: options.message };
    this.stageSession.signal(message, this.handleMessageSent);
  },

  handleMessageSent: function(error){
    if (error) {
      console.log('handleMessageSent:ERROR', error);
    } else {
      this.addMessageToUser(this.prevMessage);
    }
  },

  handlePublishOnly: function (){
    var newValue = !this.state.publishOnly;
    this.setState({publishOnly: newValue});
    if(newValue) {
      this.unsubscribeAll();
    } else {
      this.subscribeAll();
    }
  },

  unsubscribeAll: function () {
    var _this = this;
     _.each(this.state.subscribedStreams,function(subscriber){
        _this.stageSession.unsubscribe(subscriber);
    });
    this.setState({subscribedStreams:{}});
  },

  subscribeAll: function () {
    if(this.state.fanStream) this.subscribeFan(this.state.fanStream);
    if(this.state.hostStream) this.subscribeHost(this.state.hostStream);
    if(this.state.celebrityStream) this.subscribeCelebrity(this.state.celebrityStream);
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

  changeUserState: function(options) {
    this.setState({user:options});
  },

  mirrorOnOff: function (event) {
    event.preventDefault();
    var userVideo = this.state.userVideo;
    userVideo.mirrored = !userVideo.mirrored;
    this.setState({userVideo: userVideo});
  },

  renderPublishOnlyBtn: function (){
    if(this.isEventOver()) return;
    var label = !this.state.publishOnly ? 'PUBLISH ONLY OFF' : 'PUBLISH ONLY ON';
    var className = !this.state.publishOnly ? 'btn btn-danger' : 'btn btn-success';
    return (<div className="right top-event-controls">
              <button className={className} onClick={this.handlePublishOnly}>{label}</button>
            </div>);
  },

  render: function() {
    var event = this.state.data.event;

    if (!event) return this.renderEventLoadingOverlay();

    var actionBtn = this.renderActionButton();
    var streams = 0;
    if(!this.state.publishOnly) {
      streams = _.compact([this.state.hostStream,this.state.celebrityStream,this.state.fanStream]).length;
    }
    var panelBody;
    var statusLabel = this.isEventOver() ? null : this.renderStatusLabel();
    var user_type = this.getUserType();

    streams++;
    panelBody = this.renderPanelBody(streams);
    var publishOnlyBtn = this.renderPublishOnlyBtn();
    var toastContainer = React.createElement(ToastContainer, { ref: 'toastContainer', toastMessageFactory: ToastMessageFactory, className: 'toast-top-right' });
    return <Wrapper>
            {toastContainer}
            <div className={ streams > 2 ? "container-fluid" : "container" }>
              <div className="row">

                <div className="col-xs-12">
                  <div className="panel panel-default fan-live-panel fan-live-full">
                    <div className="panel-title">
                      <h4>{event.event_name} <sup>{this.displayableStatus()}</sup></h4>
                      {publishOnlyBtn}
                      <ul className="panel-tools">
                        <li>
                          <span className="alternative-title">{user_type}</span>
                        </li>
                        <li>
                          {actionBtn}
                        </li>
                      </ul>
                    </div>

                    <div className="panel-search">
                      <form>
                        <input type="text" className="form-control" placeholder="Search on this panel...">
                          <i className="fa fa-search icon"></i>
                        </input>
                      </form>
                    </div>
                    {statusLabel}
                    {panelBody}
                    <div id="prodBox" className="hidden"></div>
                  </div>
                </div>

              </div>
            </div>
            <ChatFooter ref="chatFooter"
                        key="chatFooter"
                        user={this.state.user}
                        send_message={this.sendMessage}
                        change_event={this.changeUserState} />
          </Wrapper>
  }
});

module.exports = CelebrityHostView;
