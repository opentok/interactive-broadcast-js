var _ = require("underscore");
var React       = require('react');
'use strict';

// Code Style: https://github.com/airbnb/javascript/tree/master/es5
var UserButton = React.createClass({
    getInitialState: function () {
        return {
            connected: false,
            streamUIOptions : {
                showControls: true,
                width: 320,
                height: 240,
                insertMode: 'append',
                audioVolume:100
            },
            data: {}
        };
    },

    componentDidMount: function () {
        var _this = this;
        var connectionId = this.props.user.connection.connectionId;
        this.props.publisher.on('streamDestroyed', function (event) {
            _this.closeVideoFeed();
            event.preventDefault();
        });

        // subscribe to some events
        EventSystem.on('user.toggleToBackstage.' + connectionId, this.toggleConnectToBackstage);
        EventSystem.on('user.toggleConnectFan.' + connectionId, this.toggleConnectFan);
        EventSystem.on('user.requestStageStatus.' + connectionId, this.sendUpdateStageText);
        EventSystem.on('user.disconnectFan.' + connectionId, this.disconnectFan);
    },

    /** FAN RELATED **/
    disconnectFan: function () {
        this.setState({ connected: false });
        this.sendHangUpSignal();
        this.props.unsubscribeUserCall();
        this.closeVideoFeed();

        // send new text status of call button to chat window
        EventSystem.send('user.callTextStatusChanged.' + this.props.user.connection.connectionId, 'Call');
    },

    connectFan: function () {
        if (this.props.isInFanCall()) {
          return alert("Please hang up your other call!");
        }
        this.openVideoFeed();
        this.sendCallSignal();
    },

    sendCallSignal: function () {
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

    cleanUpSessionFan: function () {
        if (this.sessionFan) {
            if (this.props.publisher) {
                this.sessionFan.unpublish(this.props.publisher);
            }
            this.sessionFan.disconnect();
        }
    },

    /** BACKSTAGE RELATED **/
    connectFanWithBackstage: function() {
        var _user =  this.props.user;
        if(this.state.connected) {
            this.disconnectFan();
        }
        this.props.setUserBackstage(_user.connection.connectionId);
    },

    /** CALLBACKS **/
    onSignalCompleted: function (error) {
        if (error) {
            console.log('onSignalCompleted: error', error);
        }
    },

    onSendCallSignal: function (error) {
      if(error) {
        console.log(error);
      } else {
        this.setState({ connected: true });
        this.props.subscribeUserCall(this.props.user);

        // send new text status of call button to chat window
        EventSystem.send('user.callTextStatusChanged.' + this.props.user.connection.connectionId, 'Hang Up');
      }
    },

    openVideoFeed: function (){
        var _user =  this.props.user;
        _user.chat.chatting = true;
        _user.chat.last_active = new Date();
        _user.chat.videoChatting = true;
        this.props.change_event(_user.connection.connectionId,_user);
    },

    closeVideoFeed: function (){
        var _user =  this.props.user;
        _user.chat.videoChatting = false;
        this.props.change_event(_user.connection.connectionId,_user);
    },

    /** EVENT HANDLERS **/
    openChat: function (){
      var _user =  this.props.user;
      _user.chat.chatting = true;
      _user.chat.last_active = new Date();
      this.props.change_event(_user.connection.connectionId,_user);
    },

    kickFan: function (event) {
      this.props.kickFan(this.props.user.connection.connectionId);
    },

    toggleConnectFan: function () {
      if (this.state.connected)
        this.disconnectFan();
      else
        this.connectFan();
    },

    toggleRecording: function () {
      if (this.state.recording) {
          this.stopRecording();
      } else {
          this.startRecording();
      }
    },

    toggleConnectToBackstage: function() {
      if (this.props.user.backstageConnected) {
          this.props.onMoveToFan();
      } else {
          if (this.props.user.connectedToHost) {
              this.disconnectFanFromStage();
          } else {
              this.connectFanWithBackstage();
          }
      }

      // send the status btn text to chat just in case it is opened
      this.sendUpdateStageText();
    },

    sendUpdateStageText: function () {
        var connectionId = this.props.user.connection.connectionId;
        EventSystem.send(
          'user.connectedBtnStatusChanged.' + connectionId,
          this.statusBtnsText().sendFanToBackstageBtnText
        );

        EventSystem.send('user.callTextStatusChanged.' + connectionId, this.callTextStatus());
    },

    disconnectFanFromStage: function (){
        var _feeds = this.props.feeds;
        var _user = this.props.user;

        if (!_feeds['fan'].stream) {
          this.props.removeUserFromState(_user);
        } else {
          var disconnectSignal = {
              to: _feeds['fan'].stream.connection,
              type: 'disconnect'
          };
          this.props.onstageSession.signal(disconnectSignal);
        }
    },

    /** UTILITIES **/
    getQualityColor: function (quality) {
      var q;
      switch(quality) {
        case '':
          q = 'grey';
          break;
        case 'Great':
          q = 'green';
          break;
        case 'Good':
          q = 'orange';
          break;
        case 'Poor':
          q = 'red';
          break;
      }
      return q;
    },

    statusBtnsText: function () {
        var sendFanToBackstageBtnText = 'Send to backstage';
        var highLight = '';

        if (this.props.user.backstageConnected) {
          sendFanToBackstageBtnText = 'Send to stage';
          highLight = 'backstage';
        } else if (this.props.user.connectedToHost) {
          sendFanToBackstageBtnText = 'End session';
          highLight = 'onstage';
        }

        return {
          highLight: highLight,
          sendFanToBackstageBtnText: sendFanToBackstageBtnText
        }
    },

    callTextStatus: function () {
      return this.state.connected ? 'Hang Up' : 'Call';
    },

    renderSnapshot: function() {
      var imgData = this.props.user.snapshot;
      var snapshot;
      if (this.props.user.snapshot) {
        var key = [this.props.index_key, 'img'].join('');
        // imgData = ['data:image/png;base64,', imgData].join('');
        snapshot = (
          <div className='img-holder'>
            <img key={key} src={imgData}></img>
          </div>
        );
      }
      return snapshot;
    },

    render: function () {
        var statusBtns = this.statusBtnsText();
        var highLight = statusBtns.highLight;
        var sendFanToBackstageBtnText = statusBtns.sendFanToBackstageBtnText;
        var connectFanBtnText = this.callTextStatus();
        var hideCallButton = (this.props.user.backstageConnected || this.props.user.connectedToHost) ? "hidden" : "";
        var hideKickButton = (this.props.user.connectedToHost) ? "hidden" : "";
        var username =  this.props.user.user.username;
        var device_class = "hidden";
        var device_title;
        var warning_icon;
        if(this.props.user.user.mobile) {
          device_title = this.props.user.user.os;
          device_class = "fa fa-mobile s-pad-left";
          if(this.props.user.user.os === 'iOS') {
            device_class = "fa fa-apple s-pad-left";
          } else if(this.props.user.user.os === 'Android') {
            device_class = "fa fa-android s-pad-left";
          }
        } else {
          device_title = this.props.user.user.browser;
          if(this.props.user.user.browser === "Chrome") {
            device_class = "fa fa-chrome s-pad-left";
          }
          if(this.props.user.user.browser === "Firefox") {
            device_class = "fa fa-firefox s-pad-left";
          }
        }
        if(this.props.user.user.show_warning) {
          const warning_text = "This fan is not recommended to go onstage for the following reason:\n" +
                               "- This fan is experiencing network connectivity issues";
          warning_icon = <i className="fa fa-warning s-pad-left red" title={warning_text}/>
        }

        var color = this.getQualityColor(this.props.user.user.quality);
        var user_quality = _.isEmpty(this.props.user.user.quality) ? "Retrieving Quality..." : ["Connection:  ",this.props.user.user.quality].join('');
        var imgHolder = this.renderSnapshot();

        return (
          <div key={this.props.index_key} draggable="true">
            <div className={['fan-line-wrap', highLight, 'clearfix'].join(' ')}>
              {imgHolder}
              <div className={this.props.user.snapshot ? 'info-holder' : ''}>
                <div className='text-wrap'>
                  <span className='name'>{warning_icon}<i className={device_class} title={device_title}/>{" "+username}</span>
                  <span className={['connection', color].join(' ')}><b>{user_quality}</b></span>
                </div>
                <div className='btn-wrap'>
                  <a href='#' className='btn btn-light' onClick={this.toggleConnectToBackstage}>{sendFanToBackstageBtnText}</a>
                  <a href='#' className={['btn btn-light', hideCallButton].join(' ')} onClick={this.toggleConnectFan}>{connectFanBtnText}</a>
                  <a href='#' className='btn btn-light' onClick={this.openChat}>Chat</a>
                  <a href='#' className={['btn btn-light', hideKickButton].join(' ')} onClick={this.kickFan}>Kick</a>
                </div>
              </div>
            </div>
          </div>
        );
    }
});

module.exports = UserButton;
