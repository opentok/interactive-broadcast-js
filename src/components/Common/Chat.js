// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { properCase } from '../../services/util';
import { sendChatMessage } from '../../actions/broadcast';
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
  chat: ChatState
};

type DispatchProps ={
  sendMessage: (ChatId, ChatMessagePartial) => void
};

type Props = BaseProps & DispatchProps;

class Chat extends Component {

  props: Props;
  state: { newMessageText: string };
  handleChange: SyntheticInputEvent => void;
  handleSubmit: SyntheticInputEvent => void;

  constructor(props: Props) {
    super(props);
    this.state = { newMessageText: '' };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e: SyntheticInputEvent) {
    const newMessageText = e.target.value;
    this.setState({ newMessageText });
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
    sendMessage(chat.chatId, message);
    this.setState({ newMessageText: '' });
  }

  render(): ReactComponent {
    const { displayed, minimized, messages, toType, to } = this.props.chat;
    const { newMessageText } = this.state;
    const { handleSubmit, handleChange } = this;
    const chattingWith = properCase(R.equals(toType, 'activeFan') ? R.prop('name', to) : (toType));
    return (
      <div className={classNames('Chat', { hidden: !displayed })}>
        <div className="ChatHeader">
          <button className="btn minimize" onClick={(): void => console.log('min')}>Chat with { chattingWith }</button>
          <button className="btn" onClick={(): void => console.log('min')}><Icon className="icon" name="close" /></button>
        </div>
        { !minimized &&
          <div className="ChatMain">
            <div className="ChatMessages">
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

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): Props => ({
  sendMessage: (chatId: ChatId, message: ChatMessagePartial): void => dispatch(sendChatMessage(chatId, message)),
});

export default connect(null, mapDispatchToProps)(Chat);
