// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import R from 'ramda';
import classNames from 'classnames';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { reorderActiveFans, chatWithActiveFan, sendToBackstage } from '../../../../actions/producer';
import { kickFanFromFeed } from '../../../../actions/broadcast';
import { properCase } from '../../../../services/util';
import './ActiveFanList.css';

const connectionQuality = (quality: null | NetworkQuality): ReactComponent => {
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
  chat: ActiveFan => void
};

const snapshot = 'https://assets.tokbox.com/solutions/images/tokbox.png';
const Fan = SortableElement(({ fan, sortable, actions, state }: { fan: ActiveFan, sortable: boolean, actions: ActiveFanActions, state: State }): ReactComponent => {
  const { chat, sendFanToBackstage, kickFan } = actions;
  const backstageFan = R.path(['broadcast', 'participants', 'backstageFan'], state);
  const isOnBackstage = backstageFan.stream && fan.streamId && R.equals(backstageFan.stream.streamId, fan.streamId);
  return (
    <li className={classNames('ActiveFan', { sortable, backstage: isOnBackstage })}>
      <div className="ActiveFanImage">
        <img src={fan.snapshot || snapshot} alt="fan-snapshot" />
      </div>
      <div className="ActiveFanMain">
        <div className="info">
          <div className="name-and-browser">
            <Icon name={R.toLower(fan.browser)} style={{ marginRight: '3px' }} />
            <span className="name">{fan.name}</span>
          </div>
          { connectionQuality(fan.connectionQuality)}
        </div>
        <div className="actions">

          {!isOnBackstage && <button className="btn white" onClick={R.partial(sendFanToBackstage, [fan])}>Send to backstage</button>}
          {isOnBackstage && <button className="btn white" onClick={R.partial(sendFanToBackstage, [fan])}>Send to stage</button>}
          <button className="btn white">Call</button>
          <button className="btn white" onClick={R.partial(chat, [fan])}>Chat</button>
          <button className="btn white" onClick={R.partial(kickFan, [isOnBackstage ? 'backstageFan' : 'fan'])}>Kick</button>
        </div>
      </div>
    </li>
  );
});

const SortableFanList: { fans: ActiveFan[], actions: ActiveFanActions, state: State } => ReactComponent =
  SortableContainer(({ fans, actions, state }: { fans: ActiveFan[], actions: ActiveFanActions, state: State }): ReactComponent => {
    const sortable = fans.length > 1;
    return (
      <ul className={classNames('ActiveFanList', { sortable })} >
        {fans.map((fan: ActiveFan, index: number): ReactComponent => (
          <Fan key={`fan-${fan.id}`} index={index} fan={fan} sortable={sortable} actions={actions} state={state} /> // eslint-disab
        ))}
      </ul>
    );
  });

type BaseProps = { activeFans: ActiveFans };
type DispatchProps = {
  reorderFans: ActiveFanOrderUpdate => void,
  actions: ActiveFanActions
};
type Props = BaseProps & DispatchProps;

class ActiveFanList extends Component {
  props: Props;
  onSortEnd: ActiveFanOrderUpdate => void;

  constructor(props: Props) {
    super(props);
    this.onSortEnd = this.props.reorderFans;
    this.sendFanToBackstage = this.props.sendFanToBackstage;
  }

  render(): ReactComponent {
    const { onSortEnd } = this;
    const { actions, state } = this.props;
    const { map, order } = this.props.activeFans;
    const buildList = (acc: ActiveFan[], id: UserId): ActiveFan[] => R.append(R.prop(id, map), acc);
    return (
      <SortableFanList
        fans={R.reduce(buildList, [], order)}
        onSortEnd={onSortEnd} actions={actions} state={state}
        lockAxis="y"
        helperClass="ProducerSidePanel-reordering"
      />
    );
  }
}

const mapStateToProps = (state: State): BaseProps => ({
  state,
});


const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  reorderFans: (update: ActiveFanOrderUpdate): void => dispatch(reorderActiveFans(update)),
  actions: {
    chat: (fan: ActiveFan): void => dispatch(chatWithActiveFan(fan)),
    sendFanToBackstage: (fan: ActiveFan): void => dispatch(sendToBackstage(fan)),
    kickFan: (participantType: ParticipantType): void => dispatch(kickFanFromFeed(participantType)),
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ActiveFanList);
