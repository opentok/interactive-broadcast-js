// @flow
import React from 'react';
import R from 'ramda';
import Chat from '../../../Common/Chat';
import './ProducerChat.css';

const renderChat = (chat: ChatState): ReactComponent => <Chat key={chat.chatId} chat={chat} />;

type Props = {
  chats: ProducerChats
};
const ProducerChat = ({ chats }: Props): ReactComponent => {
  // @TODO sort chats by user type (active fan vs participant)
  return (
    <div className="ProducerChat">
      { R.map(renderChat, R.values(chats))}
    </div>
  );
};

export default ProducerChat;
