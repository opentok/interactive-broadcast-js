var React  = require('react');
var _      = require('underscore');

var ChatBox = React.createClass({
    getInitialState:function(){
        return{
            active:true,
            message:''
        }
    },
    toggleActive:function(){
        this.setState({active:!this.state.active});
    },
    handleTextChange:function(event){
        this.setState({message:event.target.value})
    },
    handleClose:function(){
        var _user =  this.props.user;
        _user.chat.chatting = false;
        // Fix for error on new msg when closed chat
        // this.props.change_event(this.props.index_key,_user)
        this.props.change_event(_user);
        this.setState({active:false});
    },
    handleOnKeyDown: function(e) {
        if (e.keyCode === 13) {
            this.sendMessage();
            e.preventDefault();
            e.stopPropagation();
        }
    },
    sendMessage: function(){
        if (_.isEmpty(this.state.message.trim())) return;
        this.props.send_message({ to: this.props.user.chat.producerTo, message: this.state.message });
        this.setState({ message: "" });
    },
    updateScroll: function() {
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
    render:function() {
        var _this = this;
        var messages = this.props.user.chat.messages.map(function(message, index) {
            if(_this.props.user.chat.producerTo) {
                var messageClass = message.to.connectionId === _this.props.user.chat.producerTo.connectionId ? "message-wrap message-in" : "message-wrap message-out";
            } else {
                var messageClass = "message-wrap message-out";
            }
            return <span key={['message', index].join('')} className={messageClass} >{message.message}</span>
        });


        var boxClassName = !this.props.user.chat.chatting ? " hide" : this.state.active ? " active" : "";
        return (<div className={"chat-box" + boxClassName}>
            <div className="chat-box-header">
                <a href="#" className="chat-name" onClick={this.toggleActive}>Chat with <b>the Producer</b></a>
                <a href="#" className="close-chat-box" onClick={this.handleClose}><i className="fa fa-times"></i></a>
            </div>
            <div ref="messageContainer" className="messages-box">
                {messages}
            </div>
            <div className="ta-box">
                <textarea placeholder="Write a message..." autofocus value={this.state.message} onKeyDown={this.handleOnKeyDown} onChange={this.handleTextChange}></textarea>
                <button onClick={this.sendMessage} type="button" className="submit-chat"><i className="fa fa-check"></i></button>
            </div>
        </div>);
    }
});

var ChatFooter = React.createClass({
    render: function(){
        var chatBox = React.createElement(ChatBox,{ user: this.props.user, change_event: this.props.change_event, send_message: this.props.send_message });
        return (<div className="chat-footer sidebar-chat">{chatBox}</div>);

    }
});
module.exports = ChatFooter;
