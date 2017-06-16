// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import R from 'ramda';
import classNames from 'classnames';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { reorderActiveFans, chatWithActiveFan, startActiveFanCall, sendToBackstage, sendToStage } from '../../../../actions/producer';
import { kickFanFromFeed } from '../../../../actions/broadcast';
import { properCase } from '../../../../services/util';
import './ActiveFanList.css';

const networkQuality = (quality: null | NetworkQuality): ReactComponent => {
  const qualityClass = classNames('quality', R.defaultTo('retrieving')(quality));
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
  privateCall: ActiveFan => void,
  sendFanToBackstage: ActiveFan => void,
  kickFan: ParticipantType => void,
  sendFanToStage: ActiveFan => void
};

const snapshot = 'https://assets.tokbox.com/solutions/images/tokbox.png';
type FanProps = { fan: ActiveFan, sortable: boolean, actions: ActiveFanActions, backstageFan: ParticipantState };
const Fan = SortableElement(({ fan, sortable, actions, backstageFan }: FanProps): ReactComponent => {
  const { chat, sendFanToBackstage, sendFanToStage, kickFan, privateCall } = actions;
  // const backstageFan = R.path(['broadcast', 'participants', 'backstageFan'], state);
  const isOnBackstage = backstageFan.stream && fan.streamId && R.equals(backstageFan.stream.streamId, fan.streamId);
  const isOnStage = fan.isOnStage;
  return (
    <li className={classNames('ActiveFan', { sortable, backstage: isOnBackstage, stage: isOnStage })}>
      <div className="ActiveFanImage">
        <img src={fan.snapshot || snapshot} alt="fan-snapshot" />
      </div>
      <div className="ActiveFanMain">
        <div className="info">
          <div className="name-and-browser">
            <Icon name={R.toLower(fan.browser)} style={{ marginRight: '3px' }} />
            <span className="name">{fan.name}</span>
          </div>
          { networkQuality(fan.networkQuality)}
        </div>
        <div className="actions">
          {!isOnBackstage && !isOnStage && <button className="btn white" onClick={R.partial(sendFanToBackstage, [fan])}>Send to backstage</button>}
          {isOnBackstage && <button className="btn white" onClick={R.partial(sendFanToStage, [fan])}>Send to stage</button>}
          {!isOnStage && <button className="btn white" onClick={R.partial(privateCall, [fan])}>Call</button>}
          <button className="btn white" onClick={R.partial(chat, [fan])}>Chat</button>
          <button className="btn white" onClick={R.partial(kickFan, [isOnBackstage ? 'backstageFan' : 'fan'])}>Kick</button>
        </div>
      </div>
    </li>
  );
});

type SortableContainerProps = { fans: ActiveFan[], actions: ActiveFanActions, backstageFan: ParticipantState };
const SortableFanList: { fans: ActiveFan[], actions: ActiveFanActions, backstageFan: ParticipantState } => ReactComponent =
  SortableContainer(({ fans, actions, backstageFan }: SortableContainerProps): ReactComponent => {
    const sortable = fans.length > 1;
    return (
      <ul className={classNames('ActiveFanList', { sortable })} >
        {fans.map((fan: ActiveFan, index: number): ReactComponent => (
          <Fan key={`fan-${fan.id}`} index={index} fan={fan} sortable={sortable} actions={actions} backstageFan={backstageFan} /> // eslint-disab
        ))}
      </ul>
    );
  });

type BaseProps = { activeFans: ActiveFans, backstageFan: ParticipantState };
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
    const { actions, backstageFan } = this.props;
    const { map, order } = this.props.activeFans;
    const buildList = (acc: ActiveFan[], id: UserId): ActiveFan[] => R.append(R.prop(id, map), acc);
    return (
      <SortableFanList
        fans={R.reduce(buildList, [], order)}
        onSortEnd={onSortEnd} actions={actions} backstageFan={backstageFan}
        lockAxis="y"
        helperClass="ProducerSidePanel-reordering"
      />
    );
  }
}

const mapStateToProps = (state: State): BaseProps => ({
  activeFans: state.broadcast.activeFans,
  backstageFan: state.broadcast.participants.backstageFan,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  reorderFans: (update: ActiveFanOrderUpdate): void => dispatch(reorderActiveFans(update)),
  actions: {
    chat: (fan: ActiveFan): void => dispatch(chatWithActiveFan(fan)),
    privateCall: (fan: ActiveFan): void => dispatch(startActiveFanCall(fan)),
    sendFanToBackstage: (fan: ActiveFan): void => dispatch(sendToBackstage(fan)),
    sendFanToStage: (fan: ActiveFan): void => dispatch(sendToStage(fan)),
    kickFan: (participantType: ParticipantType): void => dispatch(kickFanFromFeed(participantType)),
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveFanList);
