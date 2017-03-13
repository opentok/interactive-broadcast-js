var React  = require('react');
var _      = require('underscore');
var $      = require('jquery');

var ChatBox = React.createClass({
    getInitialState: function () {
      return {
        active: true,
        message: '',
        backstageConnected: false,
        stageBtnText: 'Send to Backstage',
        callTextStatus: 'Call'
      };
    },

    componentDidMount: function () {
      var _this = this;
      var connectionId = this.props.user.connection.connectionId;

      EventSystem.on('user.connectedBtnStatusChanged.' + connectionId, function (status) {
        _this.setState({stageBtnText: status});
      });

      EventSystem.on('user.callTextStatusChanged.' + connectionId, function (status) {
        _this.setState({callTextStatus: status});
      });

      // request initial state to stage btn in chat
      this.requestStageStatus();
    },

    requestStageStatus: function () {
      // request stage button text status
      var connectionId = this.props.user.connection.connectionId;
      EventSystem.send('user.requestStageStatus.' + connectionId);
    },

    toggleActive: function () {
      this.setState({active: !this.state.active});
    },

    handleTextChange: function (event) {
      this.setState({message: event.target.value});
    },

    handleClose:function(){
      // only do this if is not a host or celeb (special Chat)
      if (!this.props.user.isSpecialChat) {
        this.props.stopChatting(this.props.user.connection);
        EventSystem.send('user.disconnectFan.' + this.props.user.connection.connectionId);
      } else {
        this.props.closeHostCelebChatting(this.props.user.connection);
      }
    },

    handleOnKeyDown: function (e) {
        if (e.keyCode === 13) {
            this.sendMessage();
            e.preventDefault();
            e.stopPropagation();
        }
    },

    sendMessage: function () {
        if (_.isEmpty(this.state.message.trim())) return;
        this.props.send_message({ to:this.props.user.connection, message:this.state.message, user_key:this.props.index_key});
        this.setState({ message: "" });
    },

    updateScroll: function () {
      var container = this.refs.messageContainer.getDOMNode();
      if (container.scrollHeight -
          (container.scrollTop + container.offsetHeight) >= 50) {
        this.scrolled = true;
      } else {
        this.scrolled = false;
      }
    },

    componentDidUpdate: function () {
      if (this.scrolled) {
        return;
      }
      var container = this.refs.messageContainer.getDOMNode();
      container.scrollTop = container.scrollHeight;
    },

    toggleToBackstage: function () {
      EventSystem.send('user.toggleToBackstage.' + this.props.user.connection.connectionId);
    },

    toggleConnectFan: function () {
      EventSystem.send('user.toggleConnectFan.' + this.props.user.connection.connectionId);
    },

    render: function () {
        var _this = this;
        var messages = this.props.user.chat.messages.map(function(message, index){
            var messageClass = message.to.connectionId === _this.props.user.connection.connectionId ? "message-wrap message-in" : "message-wrap message-out";
            return React.createElement("span", {className:messageClass, key: index}, message.message)
        });
        var boxClassName = this.props.active_chat >= 0 ? "active" : "hide";
        var hideCallButton = (this.props.user.backstageConnected || this.props.user.connectedToHost) ? "hidden" : "";
        var headerActive = '';
        var chatActive = !this.state.active ? 'hide' : 'chat-top-controls';

        if (this.props.user.connectedToHost) {
            headerActive = ' onstage';
        } else if(this.props.user.backstageConnected) {
            headerActive = ' backstage';
        }

        var chat_btns;
        var chat_video;
        if (!this.props.user.isSpecialChat) {
            chat_btns = (
                <div className={chatActive}>
                    <div className='btn-wrap'>
                        <a href='javascript:;' className='btn btn-light' onClick={this.toggleToBackstage}>{this.state.stageBtnText}</a>
                        <a href='javascript:;' className={['btn btn-light', hideCallButton].join(' ')} onClick={this.toggleConnectFan}>{this.state.callTextStatus}</a>
                    </div>
                </div>
            );
            chat_video = (
                <div className={!this.props.user.chat.videoChatting ? "messages-box hide " : "messages-box active "}>
                    <div className="video-chat" id={"feed_" + _this.props.user.connection.connectionId}></div>
                </div>
            );
        }

        var chatBoxId;
        if (this.props.user.isSpecialChat) {
            if (this.props.user.user.username === 'host') {
                chatBoxId = "chat-box-host";
            } else if (this.props.user.user.username === 'celebrity') {
                chatBoxId = "chat-box-celebrity";
            }
        }

        return (<div id={chatBoxId} className={"chat-box " + boxClassName}>
            <div className={"chat-box-header" + headerActive}>
                <a href="#" className="chat-name" onClick={this.toggleActive}>Chat with <b>{this.props.user.user.username}</b></a>
                <a href="#" className="close-chat-box" onClick={this.handleClose}><i className="fa fa-times"></i></a>
            </div>
            {chat_btns}
            {chat_video}
            <div ref="messageContainer" className={"messages-box " + chatActive}>
                {messages}
            </div>
            <div className={"ta-box "+chatActive}>
                <textarea autofocus placeholder="Write a message..." value={this.state.message} onKeyDown={this.handleOnKeyDown} onChange={this.handleTextChange}></textarea>
                <button onClick={this.sendMessage} type="button" className="submit-chat"><i className="fa fa-check"></i></button>
            </div>
        </div>);
    }
});

var ChatBubbleUser = React.createClass({
    handleClose:function(){

        // only do this if user is not host or celeb (special chat)
        if (!this.props.user.isSpecialChat) {
            this.props.stopChatting(this.props.user.connection);
            EventSystem.send('user.disconnectFan.' + this.props.user.connection.connectionId);
        } else {
            this.props.closeHostCelebChatting(this.props.user.connection);
        }
    },
    handleClick:function(){
        this.props.set_last_active(this.props.user.connection.connectionId);
    },
    render:function(){
      return (<li>
                <a onClick={this.handleClick} href="#">{this.props.user.user.username}</a>
                <i onClick={this.handleClose} className="fa fa-times"></i>
             </li>);
   }
});
var ChatBubble = React.createClass({
    toggleView:function(){
        $('.drop-up').fadeToggle('fast');
    },
    render:function(){
        var _this = this;
        var userLinks = this.props.users.map(function(user,k){
            return React.createElement(ChatBubbleUser,{user:user,key:k,
                set_last_active:_this.props.set_last_active,
                stopChatting:_this.props.stopChatting,
                closeHostCelebChatting: _this.props.closeHostCelebChatting})
        });
        return (
            <div className="hidden-boxes">
                <a href="#" className="hidden-boxes-header" onClick={this.toggleView}>
                    <i className="fa fa-comments"></i>
                    <span>{this.props.users.length}</span>
                </a>
                <div className="drop-up">
                    <ul>
                        {userLinks}
                    </ul>
                </div>
            </div>
        )
    }
});


var ChatFooter = React.createClass({
    updateScroll: function(index) {
      var container = this.refs['box' + index].getDOMNode();
      if (container.scrollHeight -
          (container.scrollTop + container.offsetHeight) >= 50) {
        this.scrolled = true;
      } else {
        this.scrolled = false;
      }
    },
    chattingUsers:function(){
      return _.filter(this.props.users,function(user){
          return user.chat.chatting;
      })
    },
    sortedChats:function(){
        return sorted = _.sortBy(this.chattingUsers(),function(user){
            return user.chat.last_active;
        })
    },
    activeChats:function(){
        var _this = this;
        var actives = _.last(this.sortedChats(),2).map(function(user, _) { return user.connection.connectionId });
        var result = _.filter(this.props.users, function(user) {
            return actives.indexOf(user.connection.connectionId) >= 0;
        });
        return result;
    },
    render: function() {
        var _this = this;
        var hiddenChat = null;
        var hiddenChatters = _.difference(this.sortedChats(),this.activeChats());
        var chatBoxes = this.props.users.map(function(user,i){
            var key = user.connection.connectionId;
            return React.createElement(ChatBox, { ref: 'box' + key,
                user:user,
                key: key,
                active_chat: _this.activeChats().indexOf(user),
                index_key: i,
                change_event: _this.props.change_event,
                send_message:_this.props.send_message,
                stopChatting:_this.props.stopChatting,
                closeHostCelebChatting: _this.props.closeHostCelebChatting
            });
        });

        if (hiddenChatters.length > 0){
            hiddenChat = React.createElement(ChatBubble,{
                users: hiddenChatters,
                set_last_active:_this.props.set_last_active,
                stopChatting:_this.props.stopChatting,
                closeHostCelebChatting: _this.props.closeHostCelebChatting
            });
        }
        return (
            <div className="chat-footer">
                {hiddenChat}
                {chatBoxes}
            </div>
        );
    }
});

module.exports = ChatFooter;
