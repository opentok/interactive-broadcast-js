var React               = require('react');
var _                   = require("underscore");
var s                   = require("underscore.string");
var ReactZeroClipboard  = require('react-zeroclipboard');
var ReactToastr         = require('react-toastr');
var moment              = require('moment');
var ToastContainer      = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);

var FeedPanel = React.createClass({
     getInitialState: function() {
        return {cropped: true,
            countback:6,
            counting:false,
            didCount:false
        };
    },
    getRenderInfo:function(){
        var feed = this.props.feed;
        var muted = feed.stream? feed.mute : false;
        var audioVolume = feed.stream? feed.audioVolume: 100;
        var _base = window.location.origin + '/show';
        var _event_url= this.props.event[feed.type+"_url"];
        var _url = _base + (feed.type == 'fan'? "/"+this.props.admins_id+'/'+_event_url : "-"+ feed.type+'/'+_event_url);
        var quality = this.getMyQuaylity();

        return {
            box_id:feed.type + "Box",
            url:_url,
            type:feed.type,
            key:feed.type,
            name:s(feed.type).capitalize().value(),
            quality: quality.label,
            quality_class: quality.className,
            microphone: muted? 'fa fa-microphone-slash' : 'fa fa-microphone',
            volume_class: (audioVolume==100)? 'fa fa-volume-up' : 'fa fa-volume-down',
            in_private_call: feed.inCall ? 'fa fa-phone-square' : 'fa fa-phone',
            stream : feed.stream,
            shouldShowCountback: feed.shouldShowCountback
        };
    },

    getMyQuaylity: function() {
        var quality;
        if(!this.props.feed.stream) {
            quality = { label:'Offline',
                        className: 'user-status'};
        } else {
            if(!this.props.user || this.props.user.isSpecialChat) {
                if(this.props.feed.quality) {
                    return this.props.feed.quality;
                } else {
                    quality = { label:'Online',
                    className: 'user-status great'};
                }
            } else {
                quality = { label:this.props.user.user.quality,
                className: 'user-status ' + this.props.user.user.quality.toLowerCase()};
            }

        }
        return quality;
    },

    videoOnOff: function () {
        var feed = this.props.feed;
        var stream = feed.stream;
        var subscriber;

        if (stream) {
            var videoMuted = !feed.videoMuted;
            var connectSignal = {
                to:   stream.connection,
                type: 'videoOnOff',
                data: JSON.stringify({ video: videoMuted ? 'off' : 'on' }),
            };

            if (feed.onBackStage) {
                this.props.backstageSession.signal(connectSignal);
                subscriber = this.props.backstageSession.getSubscribersForStream(stream)[0];
            } else {
                this.props.onstageSession.signal(connectSignal);
                subscriber = this.props.onstageSession.getSubscribersForStream(stream)[0];
            }

            if (subscriber) {
              subscriber.subscribeToVideo(!videoMuted);
              feed.videoMuted = videoMuted;
              this.props.changeFeedState(feed);
            }
        }
    },

    muteOnOff: function () {
        var feed = this.props.feed;
        if (feed.stream) {
            var muteVal = feed.mute ? false : true;
            var connectSignal = {
                to: feed.stream.connection,
                type: 'muteAudio',
                data: JSON.stringify({ mute: muteVal ? 'on' : 'off' }),
            };
            feed.mute = muteVal;
            this.props.changeFeedState(feed);
            if(feed.onBackStage) {
                this.props.backstageSession.signal(connectSignal);
            } else {
                this.props.onstageSession.signal(connectSignal);
            }
        }
    },

    cropOnOff: function () {
        var cropped = !this.state.cropped;
        this.setState({cropped: cropped});
    },

    changeVolumen: function () {
        var feed = this.props.feed;
        if (feed.stream) {
            var newVolume = (feed.audioVolume == 100) ? 25 : 100;
            feed.audioVolume = newVolume;
            this.props.changeFeedState(feed);
            var connectSignal = {
                type: 'changeVolumen',
                data: JSON.stringify({ feedType: feed.type, audioVolume: newVolume }),
            };
            if(feed.onBackStage) {
                this.props.backstageSession.signal(connectSignal);
            } else {
                this.props.onstageSession.signal(connectSignal);
            }
        }
    },

    kickUser: function () {
        var feed = this.props.feed;
        if (feed.stream) {
            if(feed.onBackStage) {
                this.props.setUserBackstage(null);
            } else {
                var disconnectSignal = {
                    to: feed.stream.connection,
                    type: 'disconnect'
                };
                this.props.onstageSession.signal(disconnectSignal);
            }
        } else {
            this.props.removeUserFromState(this.props.user);
        }

        // try to update the chat button status label
        if (this.props.user) {
            var connectionId = this.props.user.connection.connectionId;
            EventSystem.send('user.requestStageStatus.' + connectionId);
        }
    },

    callUser : function(e){
        var feed = this.props.feed;
        if (feed.stream) {
            if(feed.inCall){
                this.props.checkAndDisconnectPrivateCall();
                this.props.setInCallStatus({ inCall: null, with:null });
            }else {
                this.props.checkAndDisconnectPrivateCall();
                var privateCallSignal = {
                    type: 'privateCall',
                    data: JSON.stringify({ callWith: this.props.user.connection.connectionId }),
                };
                this.props.onstageSession.signal(privateCallSignal);
                this.props.muteOnstageFeeds(true, feed.type);
                this.props.setInCallStatus({ inCall: true, with: feed.type });
            }
        }
    },
    callFan : function(e){
        var feed = this.props.feed;
        if (feed.stream) {
            this.props.checkAndDisconnectPrivateCall();
            if (this.props.isInFanCall()){
                this.props.setInCallStatus({ inCall: null, with:null });
            } else {
                this.props.setInCallStatus({ inCall: true , with: feed.type});
                this.props.subscribeUserCall(this.props.user);
                this.sendCallSignal();
            }
        }
    },
    sendCallSignal: function() {
        var connectSignal = {
            to: this.props.user.connection,
            type: 'joinProducer'
        };
        this.props.backstageSession.signal(connectSignal, this.onSendCallSignal);
    },

    sendHangUpSignal: function () {
        var connectSignal = {
            to: this.props.user.connection,
            type: 'disconnectProducer'
        };
        this.props.backstageSession.signal(connectSignal, this.onSignalCompleted);
    },
    copiedToClipboard: function(e) {
      this.props.toastContainer.success(
        'URL successfully copied to clipboard',
        'Success',
        {
          tapToDismiss: true,
          closeButton: true,
          showAnimation: 'animated fadeInDown',
          hideAnimation: 'animated fadeOutUp',
          clearAlert: function() {
            this.refs.container.clear();
          }
        }
      );
    },
    moveToFan: function(){
        var quality = this.getMyQuaylity();
        this.props.onMoveToFan(quality);
    },

    chatHostCeleb: function() {
        if (this.props.user && this.props.user.connection) {
            this.props.openHostCelebChat(this.props.user.connection.connectionId);
        }
    },
    startCountback:function(){
        if(this.counting) return;
        this.counting = true;
        var _this = this;

        var counter = setInterval(function(){
            var count = _this.state.countback;

            if(_this.props.feed.shouldShowCountback){
                _this.props.changeFeedCountback(_this.props.feed.type,false);
            }
            _this.setState({countback: count - 1});

            if (_this.state.countback == 1){
                _this.props.sendConnectNowSignal()
            }

            if (_this.state.countback <= 0) {
                _this.counting = false;
                _this.setState({countback: 6});
                clearInterval(counter);
            }
        }, 1000);
    },

    render: function () {
        var info = this.getRenderInfo();
        var url_copy_btn = React.createElement(ReactZeroClipboard, {text:info.url, onAfterCopy: this.copiedToClipboard,key:info.url}, <a className="btn btn-light" href="javascript:void(0);">COPY</a>);
        var btn_class = info.stream ? "btn btn-light btn-icon" : "btn btn-light btn-icon disabled";
        var crop_icon_class = info.stream ? this.state.cropped ? "fa fa-crop color5" : "fa fa-crop" : "";
        var video_box_class = this.state.cropped ? "videoBox" : "videoBox removeCrop";
        var video_class = this.props.feed.videoMuted ? "fa fa-video-camera off" + (this.props.event_status === 'L' ? ' live' : '')  : "fa fa-video-camera";
        var btn_kick_user = '';
        if (info.type == 'fan' || info.type == 'backstage_fan') {
            btn_kick_user = <a className={btn_class} title="Kick fan" href="#" onClick={this.kickUser}><i className="fa fa-ban"></i></a>
        }

        var btn_chat_host_celebrity;
        if (info.type == 'host' || info.type == 'celebrity') {
            btn_chat_host_celebrity = <a className={btn_class} title={"Chat " + info.type} href="#" onClick={this.chatHostCeleb}><i className="fa fa-comment"></i></a>
        }
        var btn_call_user;
        if(this.props.event_status !== 'L') {
            btn_call_user = <a className={btn_class} href="#" onClick={info.type == 'backstage_fan' ? this.callFan : this.callUser}><i className={info.in_private_call}></i></a>
        }
        var controls_footer = React.createElement('div',{className:"foot-options",key:info.type}, [
                    <span className="alter">Alter Feed</span>,
                    <div className="right-btns">
                        <div className={btn_class + " volume-slider"} href="#" onClick={this.changeVolumen}>
                          <i className={info.volume_class}></i>
                          <div className="slider-wrap">
                            <div className="bg-main">
                              <div className="bg-color">
                                <a href="#" className="slide-trigger"></a>
                              </div>
                            </div>
                          </div>
                        </div>
                        {btn_call_user}
                        <a className={btn_class} href="#" onClick={this.muteOnOff}><i className={info.microphone}></i></a>
                        <a className={btn_class} href="#" onClick={this.videoOnOff}><i className={video_class}></i></a>
                        {btn_chat_host_celebrity}
                        {btn_kick_user}
                    </div>
                ])
        if(info.type != 'backstage_fan'){
            var footer = React.createElement('div',{className:"feed-footer"}, [
                <div className="foot-options">
                    <span className="small url">{info.url}</span>
                    <div className="right-btns">
                        {url_copy_btn}
                    </div>
                </div>,
                controls_footer])
        }else{
            var footer = React.createElement('div',{className:"feed-footer"},[
                <div className="foot-options">
                    <a href="#" onClick={this.moveToFan}>Move to Fan Feed</a>
                </div>,
                controls_footer]);
        }
        if(this.props.feed.shouldShowCountback){
            _.delay(this.startCountback,1000);
        }
        if(this.state.countback == 6){
            var countdown_class = "hidden";
        }else{
            var countdown_class = "countdown-overlay" ;
        }

        var message_bar_class = info.stream && this.props.feed.mute ? "message-bar" : "hidden";
        var message_bar_text = "MUTED";

        return (
          <div>
            <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
              <div className="panel panel-transparent feed-panel">
                  <div className="panel-title">
                      {info.type}
                      <ul className="panel-tools">
                          <li className={info.quality_class}><i className="fa fa-circle"></i><span>{info.quality}</span></li>
                      </ul>
                  </div>
                  <div className="panel-body feed-window hide-overflow">
                      <div id="user_holder" className={video_box_class}>
                          <div className={message_bar_class}>
                              {message_bar_text}
                          </div>
                          <div className={countdown_class}>
                            <span className="countdown-text">{this.state.countback}</span>
                          </div>
                          <div id={info.box_id} className="feedHolder"></div>
                          <a className="btn-crop" href="#" onClick={this.cropOnOff}><i className={crop_icon_class}></i></a>
                      </div>
                      <a className="f-s-mode" href="#"><i className="fa fa-arrows-alt"></i></a>
                  </div>
                  {footer}
              </div>
          </div>
        </div>
      );
    }
})

var Dashboard = React.createClass({
    getInitialState: function() {
        return {
            event: this.props.event,
            users: [],
            streamUIOptions : {
                showControls: false,
                width: "100%",
                height: "100%",
                frameRate: 15,
                insertMode: 'append',
                audioVolume:100
            },
            data:{},
            components:[],
            isInCall:false,
            users_count: '0 / ' + this.props.interactiveLimit
        };
    },

    componentDidMount: function() {
        this.elapsedTimeInterval = window.setInterval(this.setElapsedTime,1000);
    },

    clearElapsedTimeInterval: function () {
        if(this.elapsedTimeInterval) {
            window.clearInterval(this.elapsedTimeInterval);
            this.elapsedTimeInterval = null;
        }
    },

    setElapsedTime: function() {
        var started  = this.props.event.show_started;
        var now = moment().format("YYYY-MM-DD HH:mm:ss");
        var diff = '--:--:--';
        if(started) {
          started = started.substring(0, 19);
          started = moment(moment.utc(started).toDate()).format('YYYY-MM-DD HH:mm:ss');
          diff = moment.utc(moment(now).diff(moment(started))).format('HH:mm:ss');
        }
        this.setState({elapsedTime:diff});
    },

    updateInteractiveUsers: function (users) {
        this.setState({users_count:users});
    },
    getUser: function(connectionId){
        return this.props.getUserByConnectionId(connectionId);
    },
    setInCallStatus:function(inCall){
        this.setState({isInCall:inCall})
    },
    goLive: function () {
        this.props.onEventGoLive();
    },
    renderStatusLabel:function(){
        var label = null;
        if(this.state.isInCall.inCall){
            label = (<div className="status-large stat-red">You are in a private call with {this.state.isInCall.with}</div>);
        }
        return label;
    },

    renderPostProductionURL: function () {
        if(!this.props.postProductionUrlEnabled || this.refs.FeedPanelbackstage_fan === undefined) return;
        var _event = this.props.event;
        var _this = this;
        var postProductionURL = [window.location.origin,'post-production',this.props.admins_id, _event.fan_url].join('/');
        var post_production_url_copy_btn = React.createElement(ReactZeroClipboard, {text:postProductionURL, onAfterCopy: _this.refs.FeedPanelbackstage_fan.copiedToClipboard, key:postProductionURL}, <a className="btn btn-light" href="javascript:void(0);">COPY</a>);
        var postProductionClass = 'postproductionurl-active';
        return (<span className="postproductionurl small url"><strong>POST PRODUCTION URL:  </strong><a href={postProductionURL}>{postProductionURL}</a> {post_production_url_copy_btn}</span>);
    },
    renderBroadcastURL: function(){
        var _this = this;
        var broadcastURL = this.props.event.broadcastURL;
        if (!broadcastURL || !this.props.broadcastEnabled()) return;
        var broadcast_url_copy_btn = React.createElement(ReactZeroClipboard, {text:broadcastURL, onAfterCopy: _this.refs.FeedPanelbackstage_fan.copiedToClipboard, key:broadcastURL}, <a className="btn btn-light" href="javascript:void(0);">COPY BROADCAST URL</a>);
        return (<span className="broadcast-url small url"><a href={broadcastURL}></a> {broadcast_url_copy_btn}</span>);
    },
    renderAdminIdCopy: function(){
      if(this.refs.FeedPanelbackstage_fan === undefined) return;
      var _this = this;
      var adminId = this.props.admins_id;
      var admin_copy_btn = React.createElement(ReactZeroClipboard, {text:adminId, onAfterCopy: _this.refs.FeedPanelbackstage_fan.copiedToClipboard, key:adminId}, <a className="btn btn-light" href="javascript:void(0);">COPY ADMIN ID</a>);
      return (<span className={"adminid small url " + ((!this.props.event.broadcastURL || !this.props.broadcastEnabled()) ? 'right-margin' : '')}>{admin_copy_btn}</span>);
    },
    renderUserCount: function () {
        if(parseInt(this.props.interactiveLimit) <= 0) return;
        return (<div><i className="fa fa-user" aria-hidden="true"></i>
                    <span style={{paddingLeft:"5px"}}>Viewers</span> <span> {this.state.users_count} </span></div>);
    },
    renderElapsedTime: function () {
        return (<div><i className="fa fa-clock-o" aria-hidden="true"></i>
                    <span style={{paddingLeft:"5px"}}>Elapsed time</span> <span> {this.state.elapsedTime} </span></div>);
    },

    render: function(){
        var _event = this.props.event;
        var _this = this;
        var statusLabel = this.renderStatusLabel();

        var liveLabel = '';
        var archivingLabel = '';
        var hlsEnabledLabel = '';
        var endEventBtn = '';
        var goLiveBtn = '';
        var showEnded = (_event.status === 'C') ? <span className="event-status show-ended">ENDED</span> : '';
        var usersCount = this.renderUserCount();
        var elapsedTime = this.renderElapsedTime();

        if (_event.status === 'L') {
            liveLabel = <span className="event-status live">LIVE</span>;
            if(_event.archive_id) {
                archivingLabel = <span className="event-status live"><i className="fa fa-circle"></i> ARCHIVING</span>;
            } /*else {
                archivingLabel = <span className="event-status show-ended">ARCHIVING OFF</span>;
            }*/

            if(this.props.broadcastEnabled()) {
                hlsEnabledLabel = <span className="event-status live"><i className="fa fa-play"></i> BROADCAST ON</span>;
            }/* else {
                hlsEnabledLabel = <span className="event-status show-ended">BROADCAST OFF</span>;
            }*/

            endEventBtn = <button className="btn btn-danger actions end-show" onClick={this.props.endEvent}><i className="fa fa-times"></i>END SHOW</button>;
        }

        if (_event.status === 'P') {
            if (_this.props.connectedTo.backstage && _this.props.connectedTo.onstage) {
                goLiveBtn = <button className="btn btn-light go-live" onClick={this.goLive}><i className="fa fa-circle"></i>GO LIVE</button>;
            } else {
                goLiveBtn = <button className="btn btn-light go-live" ><i className="fa fa-spinner fa-spin"></i>CONNECTING TO SESSIONS...</button>;
            }
        }

        var toastContainer = React.createElement(ToastContainer, { ref: 'container', toastMessageFactory: ToastMessageFactory, className: 'toast-top-right' });
        var feedBoxes = _.map(this.props.feeds, function(feed,i){
            return React.createElement(FeedPanel, {
                user: feed.stream?_this.getUser(feed.stream.connection.connectionId):null,
                key: ['FeedPanel',i].join(''),
                event_status: _this.props.event.status,
                admins_id: _this.props.admins_id,
                feed: feed, event: _event,
                onMoveToFan: _this.props.onMoveToFan,
                changeFeedState: _this.props.changeFeedState,
                changeFeedCountback: _this.props.changeFeedCountback,
                onstageSession: _this.props.onstageSession,
                setUserBackstage: _this.props.setUserBackstage,
                backstageSession: _this.props.backstageSession,
                toastContainer: _this.refs.container,
                openHostCelebChat: _this.props.openHostCelebChat,
                removeUserFromState: _this.props.removeUserFromState,
                muteOnstageFeeds: _this.props.muteOnstageFeeds,
                unsubscribeUserCall: _this.props.unsubscribeUserCall,
                subscribeUserCall: _this.props.subscribeUserCall,
                isInFanCall:_this.props.isInFanCall,
                setInCallStatus:_this.setInCallStatus,
                checkAndDisconnectPrivateCall:_this.props.checkAndDisconnectPrivateCall,
                sendConnectNowSignal:_this.props.sendConnectNowSignal,
                ref: ['FeedPanel',i].join('')
            });
        });

        var postProduction = this.renderPostProductionURL();
        var broadcastURL = this.renderBroadcastURL();
        var adminIdCopy = this.renderAdminIdCopy();
        var postProductionClass = this.props.postProductionUrlEnabled ? 'postproductionurl-active' : '';
        return (
            <div>
                {toastContainer}
                <div className={"page-header " + postProductionClass}>
                    <ol className="breadcrumb">
                        <li><a href="/admin">Back To Events</a></li>
                        <li className="active">{_event.event_name}</li>
                    </ol>
                    <h1 className="title">{_event.event_name}</h1>
                    {postProduction}
                    {adminIdCopy}
                    {broadcastURL}
                    <div className="right top-event-controls">
                        {liveLabel}
                        {archivingLabel}
                        {hlsEnabledLabel}
                        {goLiveBtn}
                        {endEventBtn}
                        {showEnded}
                        <a href="#sidepanel" className="btn btn-light sidepanel-open-button"><i className="fa fa-outdent"></i></a>
                    </div>
                </div>
                <div id="show_container" className="container-default">
                    <div className="user-count">
                    {usersCount}
                    {elapsedTime}
                    </div>
                    {statusLabel}
                    <div className="row">
                        {feedBoxes}
                    </div>
                </div>
            </div>

        );
    }
});
module.exports = Dashboard;
