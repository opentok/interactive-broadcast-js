// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import Chat from '../../../Common/Chat';
import { minimizeChat, displayChat, kickFanFromFeed } from '../../../../actions/broadcast';
import { sendToBackstage, sendToStage, startActiveFanCall, endActiveFanCall } from '../../../../actions/producer';
import './ProducerChat.css';

const renderChat = (chat: ChatState): ReactComponent => <Chat key={chat.chatId} chat={chat} />;
const renderChatWithActions = (chat: ChatState, actions: ReactComponent): ReactComponent =>
  <Chat key={chat.chatId} chat={chat} actions={actions} />;

class ActiveFanChats extends Component {
  props: Props;
  state: {
    showingList: boolean
  }
  toggleShowingList: Unit;
  toggleChat: ChatId => void;

  constructor(props: Props) {
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
    const { chats, activeFans } = this.props;
    const { showingList } = this.state;
    const { toggleShowingList } = this;
    const nonActive = R.either(R.propEq('minimized', true), R.propEq('displayed', false));
    const [nonActiveChats, activeChats] = R.partition(nonActive, chats);
    const nonActiveOpenChats = R.reject(R.propEq('displayed', false), nonActiveChats);
    const { kickFan, sendFanToBackstage, sendFanToStage, startCall, endCall } = R.prop('actions', this.props);
    const nonActiveChatItem = (chat: ChatState): ReactComponent =>
      <li key={chat.chatId}>
        <button className="btn blue" onClick={R.partial(toggleChat, [chat.chatId])}>
          <Icon className="icon" name="comments-o" />
          Chat with {R.path(['to', 'name'], chat)}
        </button>
      </li>;

    const activeFanChatActions = (chat: ChatState): ReactComponent => {
      const fan: ActiveFan = R.prop(R.path(['to', 'id'], chat), activeFans);

      const getStageAction = (): ({ stageAction: (?Fan) => void, stageText: string }) => {
        if (fan.isBackstage) {
          return { stageAction: sendFanToStage, stageText: 'Send To Stage' };
        } else if (fan.isOnStage) {
          return { stageAction: R.partial(kickFan, ['backstageFan']), stageText: 'Kick Fan' };
        }
        return { stageAction: R.partial(sendFanToBackstage, [fan]), stageText: 'Send to Backstage' };
      };

      const getPrivateCallAction = (): { callAction: Unit, callText: string } => {
        const { inPrivateCall } = fan;
        const callText = inPrivateCall ? 'Hang Up' : 'Call';
        const callAction = R.partial(inPrivateCall ? endCall : startCall, [chat.to]);
        return { callAction, callText };
      };

      const { stageAction, stageText } = getStageAction();
      const { callAction, callText } = getPrivateCallAction();

      return (
        <div className="ChatActions">
          <button className="btn white" onClick={stageAction}>{stageText}</button>
          <button className="btn white" onClick={callAction}>{callText}</button>
        </div>);
    };

    return R.isEmpty(chats) ? null :
    <div className="Active-Fan-Chats">
      { R.map((c: ChatState): ReactComponent => renderChatWithActions(c, activeFanChatActions(c)), R.values(activeChats)) }
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

type ActiveFanActions = {
  sendFanToBackstage: ActiveFan => void,
  kickFan: ParticipantType => void,
  sendFanToStage: ActiveFan => void,
  startCall: ActiveFanWithConnection => void,
  endCall: ActiveFanWithConnection => void
};
type InitialProps = { chats: ProducerChats };
type BaseProps = { activeFans: ActiveFanMap };
type DispatchProps = {
  toggleActiveChat: ChatId => void,
  actions: ActiveFanActions
};
type Props = InitialProps & BaseProps & DispatchProps;
const ProducerChat = ({ chats, activeFans, actions, toggleActiveChat }: Props): ReactComponent => {
  const activeOrBackstageFan = R.either(R.propEq('toType', 'activeFan'), R.propEq('toType', 'backstageFan'));
  const [activeFanChats, participantChats] = R.partition(activeOrBackstageFan, chats);

  return (
    <div className="ProducerChat">
      { R.map(renderChat, R.values(participantChats))}
      <ActiveFanChats chats={activeFanChats} activeFans={activeFans} actions={actions} toggleActiveChat={toggleActiveChat} />
    </div>
  );
};

const mapStateToProps = (state: State): BaseProps => ({
  activeFans: R.path(['broadcast', 'activeFans', 'map'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  toggleActiveChat: (id: ChatId): void => R.forEach(dispatch, [minimizeChat(id, false), displayChat(id, true)]),
  actions: {
    sendFanToBackstage: (fan: ActiveFan): void => dispatch(sendToBackstage(fan)),
    sendFanToStage: (): void => dispatch(sendToStage()),
    kickFan: (participantType: ParticipantType): void => dispatch(kickFanFromFeed(participantType)),
    startCall: (fan: ActiveFanWithConnection): void => dispatch(startActiveFanCall(fan)),
    endCall: (fan: ActiveFanWithConnection): void => dispatch(endActiveFanCall(fan)),
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ProducerChat);
