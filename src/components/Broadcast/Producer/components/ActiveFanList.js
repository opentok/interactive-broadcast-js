// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import R from 'ramda';
import classNames from 'classnames';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import {
  reorderActiveFans,
  chatWithActiveFan,
  connectPrivateCall,
  sendToBackstage,
  sendToStage,
  kickFanFromFeed,
} from '../../../../actions/producer';
import { forceFanToDisconnect } from '../../../../actions/broadcast';
import { properCase, fanTypeForActiveFan } from '../../../../services/util';
import './ActiveFanList.css';

const networkQuality = (quality: null | NetworkQuality): ReactComponent => {
  const qualityClass = classNames('quality', R.toLower(quality || 'retrieving'));
  return (
    <div className="connection">
      {
        R.ifElse(
          R.isNil,
          (): ReactComponent => <span className={qualityClass}>Retrieving quality . . .</span>, // $FlowFixMe
          (): ReactComponent => <span className={qualityClass}>Connection: {properCase(quality)}</span> // eslint-disable-line comma-dangle
        )(quality)
      }
    </div>);
};

type ActiveFanActions = {
  chat: ActiveFan => void,
  connectCall: (FanType, UserId) => void,
  sendFanToBackstage: ActiveFan => void,
  kickFan: FanParticipantType => void,
  forceDisconnect: ActiveFan => void,
  sendFanToStage: ActiveFan => void
};

const snapshot = 'https://assets.tokbox.com/solutions/images/tokbox.png';
type FanProps = { fan: ActiveFan, sortable: boolean, actions: ActiveFanActions, backstageFan: FanParticipantState, fanTransition: boolean };
const Fan = SortableElement(({ fan, sortable, actions, fanTransition }: FanProps): ReactComponent => {
  const { chat, sendFanToBackstage, sendFanToStage, kickFan, connectCall, forceDisconnect } = actions;
  const { inPrivateCall, isOnStage, isBackstage } = fan;
  const privateCall = R.partial(connectCall, [fanTypeForActiveFan(fan), fan.id]);
  const removeFan = (): void => isBackstage || isOnStage ? kickFan(isBackstage ? 'backstageFan' : 'fan') : forceDisconnect(fan);
  const fanIcon = R.toLower(fan.browser || fan.os || '');
  return (
    <li className={classNames('ActiveFan', { sortable, backstage: isBackstage, stage: isOnStage })}>
      <div className="ActiveFanImage">
        <img src={fan.snapshot || snapshot} alt="fan-snapshot" />
      </div>
      <div className="ActiveFanMain">
        <div className="info">
          <div className="name-and-browser">
            <Icon name={fanIcon} style={{ marginRight: '3px' }} />
            <span className="name">{fan.name}</span>
          </div>
          { networkQuality(fan.networkQuality)}
        </div>
        <div className="actions">
          {!isBackstage && !isOnStage && <button disabled={fanTransition} className={classNames('btn white', { disabled: fanTransition })} onClick={R.partial(sendFanToBackstage, [fan])}>Send to backstage</button>}
          {isBackstage && <button className="btn white" onClick={R.partial(sendFanToStage, [fan])}>Send to stage</button>}
          {!isOnStage && <button className="btn white" onClick={R.partial(privateCall, [fan])}>{ inPrivateCall ? 'Hang Up' : 'Call'}</button>}
          <button className="btn white" onClick={R.partial(chat, [fan])}>Chat</button>
          <button className="btn white" onClick={removeFan}>Kick</button>
        </div>
      </div>
    </li>
  );
});

type SortableContainerProps = { fans: ActiveFan[], actions: ActiveFanActions, backstageFan: FanParticipantState, fanTransition: boolean };
const SortableFanList: { fans: ActiveFan[], actions: ActiveFanActions, backstageFan: FanParticipantState, fanTransition: boolean } => ReactComponent =
  SortableContainer(({ fans, actions, backstageFan, fanTransition }: SortableContainerProps): ReactComponent => {
    const sortable = fans.length > 1;
    return (
      <ul className={classNames('ActiveFanList', { sortable })} >
        {fans.map((fan: ActiveFan, index: number): ReactComponent => (
          <Fan key={`fan-${fan.id}`} index={index} fan={fan} sortable={sortable} actions={actions} backstageFan={backstageFan} fanTransition={fanTransition} /> // eslint-disab
        ))}
      </ul>
    );
  });

type BaseProps = { activeFans: ActiveFans, backstageFan: FanParticipantState, fanTransition: boolean };
type DispatchProps = {
  reorderFans: ActiveFanOrderUpdate => void,
  actions: ActiveFanActions
};
type Props = BaseProps & DispatchProps;

class ActiveFanList extends Component {
  props: Props;
  onSortEnd: ActiveFanOrderUpdate => void;
  sendFanToBackstage: ActiveFan => void;
  sendFanToStage: ActiveFan => void;

  constructor(props: Props) {
    super(props);
    this.onSortEnd = this.props.reorderFans;
    this.sendFanToBackstage = this.props.actions.sendFanToBackstage;
    this.sendFanToStage = this.props.actions.sendFanToStage;
  }

  render(): ReactComponent {
    const { onSortEnd } = this;
    const { actions, backstageFan, fanTransition } = this.props;
    const { map, order } = this.props.activeFans;
    const buildList = (acc: ActiveFan[], id: UserId): ActiveFan[] => R.append(R.prop(id, map), acc);
    return (
      <SortableFanList
        fans={R.reduce(buildList, [], order)}
        onSortEnd={onSortEnd} actions={actions} backstageFan={backstageFan} fanTransition={fanTransition}
        lockAxis="y"
        helperClass="ProducerSidePanel-reordering"
      />
    );
  }
}

const mapStateToProps = (state: State): BaseProps => ({
  activeFans: state.broadcast.activeFans,
  backstageFan: state.broadcast.participants.backstageFan,
  fanTransition: state.broadcast.fanTransition,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  reorderFans: (update: ActiveFanOrderUpdate): void => dispatch(reorderActiveFans(update)),
  actions: {
    chat: (fan: ActiveFan): void => dispatch(chatWithActiveFan(fan)),
    connectCall: (fanType: FanType, fanId: UserId): void => dispatch(connectPrivateCall(fanType, fanId)),
    sendFanToBackstage: (fan: ActiveFan): void => dispatch(sendToBackstage(fan)),
    sendFanToStage: (fan: ActiveFan): void => dispatch(sendToStage(fan)),
    kickFan: (participantType: FanParticipantType): void => dispatch(kickFanFromFeed(participantType)),
    forceDisconnect: (fan: ActiveFan): void => dispatch(forceFanToDisconnect(fan)),
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveFanList);
