// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { properCase } from '../../services/util';
import { sendChatMessage, minimizeChat, displayChat } from '../../actions/broadcast';
import './Chat.css';

const Message = (message: ChatMessage): ReactComponent => {
  const { isMe } = message;
  const messageClass = classNames('Message', { isMe });
  return (
    <div className={messageClass} key={message.timestamp}>
      <div className="MessageText">
        { message.text }
      </div>
    </div>
  );
};

type BaseProps = {
  chat: ChatState,
  actions?: ReactComponent
};

type DispatchProps ={
  sendMessage: (ChatMessagePartial) => void,
  minimize: Unit,
  hide: Unit
};

type Props = BaseProps & DispatchProps;

class Chat extends Component {

  props: Props;
  state: { newMessageText: string };
  messageContainer: HTMLDivElement;
  updateScrollPosition: Unit;
  handleChange: SyntheticInputEvent => void;
  handleSubmit: SyntheticInputEvent => void;

  constructor(props: Props) {
    super(props);
    this.state = { newMessageText: '' };
    this.updateScrollPosition = this.updateScrollPosition.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e: SyntheticInputEvent) {
    const newMessageText = e.target.value;
    this.setState({ newMessageText });
  }

  updateScrollPosition() {
    const { messageContainer } = this;
    setTimeout(() => {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }, 0);
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { newMessageText } = this.state;
    if (R.isEmpty(newMessageText)) { return; }

    const { sendMessage, chat } = this.props;

    const message = {
      text: newMessageText,
      timestamp: Date.now(),
      fromType: chat.fromType,
      fromId: chat.fromId,
    };
    sendMessage(message);
    this.setState({ newMessageText: '' }, this.updateScrollPosition);
  }

  render(): ReactComponent {
    const { displayed, minimized, messages, toType, to } = this.props.chat;
    const { minimize, hide } = this.props;
    const ChatActions = R.propOr(null, 'actions', this.props);
    const { newMessageText } = this.state;
    const { handleSubmit, handleChange } = this;
    const chattingWithActiveFan = R.equals(toType, 'activeFan');
    const chattingWith = properCase(chattingWithActiveFan ? R.prop('name', to) : (toType));
    const inPrivateCall = R.and(chattingWithActiveFan, R.prop('inPrivateCall', this.props.chat));
    return (
      <div className={classNames('Chat', toType, { hidden: !displayed })}>
        <div className="ChatHeader">
          <button className="btn minimize" onClick={minimize}>Chat with { chattingWith }</button>
          <button className="btn" onClick={hide}><Icon className="icon" name="close" /></button>
        </div>
        { ChatActions }
        <div id={`videoActiveFan${R.prop('id', to)}`} className={classNames('ChatPrivateCall', { inPrivateCall })} />
        { !minimized &&
          <div className="ChatMain">
            <div className="ChatMessages" ref={(el: HTMLDivElement) => { this.messageContainer = el; }} >
              { R.map(Message, messages) }
            </div>
            <form className="ChatForm" onSubmit={handleSubmit}>
              <input
                type="text"
                name="newMessageText"
                placeholder="Write a message . . ."
                value={newMessageText}
                onChange={handleChange}
              />
              <button type="submit" className="btn"><Icon className="icon" name="check" /></button>
            </form>
          </div>
        }
      </div>
    );
  }
}

const mapDispatchToProps: MapDispatchWithOwn<DispatchProps, BaseProps> = (dispatch: Dispatch, ownProps: BaseProps): DispatchProps => ({
  sendMessage: (message: ChatMessagePartial): void => dispatch(sendChatMessage(ownProps.chat.chatId, message)),
  minimize: (): void => dispatch(minimizeChat(ownProps.chat.chatId, !ownProps.chat.minimized)),
  hide: (): void => dispatch(displayChat(ownProps.chat.chatId, false)),
});

export default connect(null, mapDispatchToProps)(Chat);
