// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import R from 'ramda';
import classNames from 'classnames';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { reorderActiveFans, chatWithActiveFan } from '../../../../actions/producer';
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
const Fan = SortableElement(({ fan, sortable, actions }: { fan: ActiveFan, sortable: boolean, actions: ActiveFanActions }): ReactComponent => {
  const { chat } = actions;
  return (
    <li className={classNames('ActiveFan', { sortable })}>
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
          <button className="btn white">Send to backstage</button>
          <button className="btn white">Call</button>
          <button className="btn white" onClick={R.partial(chat, [fan])}>Chat</button>
          <button className="btn white">Kick</button>
        </div>
      </div>
    </li>
  );
});

const SortableFanList: { fans: ActiveFan[], actions: ActiveFanActions } => ReactComponent =
  SortableContainer(({ fans, actions }: { fans: ActiveFan[], actions: ActiveFanActions }): ReactComponent => {
    const sortable = fans.length > 1;
    return (
      <ul className={classNames('ActiveFanList', { sortable })} >
        {fans.map((fan: ActiveFan, index: number): ReactComponent => (
          <Fan key={`fan-${fan.id}`} index={index} fan={fan} sortable={sortable} actions={actions} /> // eslint-disab
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
  }

  render(): ReactComponent {
    const { onSortEnd } = this;
    const { actions } = this.props;
    const { map, order } = this.props.activeFans;
    const buildList = (acc: ActiveFan[], id: UserId): ActiveFan[] => R.append(R.prop(id, map), acc);
    return (
      <SortableFanList
        fans={R.reduce(buildList, [], order)}
        onSortEnd={onSortEnd} actions={actions}
        lockAxis="y"
        helperClass="ProducerSidePanel-reordering"
      />
    );
  }
}

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  reorderFans: (update: ActiveFanOrderUpdate): void => dispatch(reorderActiveFans(update)),
  actions: {
    chat: (fan: ActiveFan): void => dispatch(chatWithActiveFan(fan)),
  },
});

export default connect(null, mapDispatchToProps)(ActiveFanList);
