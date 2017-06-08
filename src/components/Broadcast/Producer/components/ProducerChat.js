// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import Chat from '../../../Common/Chat';
import { minimizeChat, displayChat } from '../../../../actions/broadcast';
import './ProducerChat.css';

const renderChat = (chat: ChatState): ReactComponent => <Chat key={chat.chatId} chat={chat} />;

type ActiveFanChatsProps = { chats: ProducerChats, toggleActiveChat: ChatId => void };
class ActiveFanChats extends Component {
  props: Props;
  state: {
    showingList: boolean
  }
  toggleShowingList: Unit;
  toggleChat: ChatId => void;

  constructor(props: ActiveFanChatsProps) {
    super(props);
    this.state = { showingList: false };
    this.toggleShowingList = this.toggleShowingList.bind(this);
    this.toggleChat = this.toggleChat.bind(this);
  }

  toggleShowingList() {
    const { showingList } = this.state;
    this.setState({ showingList: !showingList });
  }

  toggleChat(id: ChatId) {
    this.setState({ showingList: false });
    this.props.toggleActiveChat(id);
  }

  render(): ReactComponent {
    const { toggleChat } = this;
    const { chats } = this.props;
    const { showingList } = this.state;
    const { toggleShowingList } = this;
    const nonActive = R.either(R.propEq('minimized', true), R.propEq('displayed', false));
    const [nonActiveChats, activeChats] = R.partition(nonActive, chats);
    const nonActiveOpenChats = R.reject(R.propEq('displayed', false), nonActiveChats);
    const nonActiveChatItem = (chat: ChatState): ReactComponent =>
      <li key={chat.chatId}>
        <button className="btn blue" onClick={R.partial(toggleChat, [chat.chatId])}>
          <Icon className="icon" name="comments-o" />
          Chat with {R.path(['to', 'name'], chat)}
        </button>
      </li>;

    return R.isEmpty(chats) ? null :
    <div className="Active-Fan-Chats">
      { R.map(renderChat, R.values(activeChats)) }
      { !R.isEmpty(nonActiveOpenChats) &&
        <div className="non-active-list-container">
          { showingList ?
            <ul className="non-active-list" >
              { R.map(nonActiveChatItem, R.values(nonActiveOpenChats)) }
            </ul>
            :
            <button className="btn blue toggle-list" onClick={toggleShowingList}>
              <Icon className="icon" name="comments" />
              {R.length(R.keys(nonActiveOpenChats))}
            </button>
          }
        </div>
      }
    </div>;
  }
}

type InitialProps = { chats: ProducerChats };
type DispatchProps = { toggleActiveChat: ChatId => void };
type Props = InitialProps & DispatchProps;
const ProducerChat = ({ chats, toggleActiveChat }: Props): ReactComponent => {
  const [activeFanChats, participantChats] = R.partition(R.propEq('toType', 'activeFan'), chats);
  return (
    <div className="ProducerChat">
      { R.map(renderChat, R.values(participantChats))}
      <ActiveFanChats chats={activeFanChats} toggleActiveChat={toggleActiveChat} />
    </div>
  );
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  toggleActiveChat: (id: ChatId): void => R.forEach(dispatch, [minimizeChat(id, false), displayChat(id, true)]),
});

export default connect(null, mapDispatchToProps)(ProducerChat);
