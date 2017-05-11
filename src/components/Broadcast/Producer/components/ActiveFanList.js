// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import R from 'ramda';
import classNames from 'classnames';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { reorderActiveFans } from '../../../../actions/producer';
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

const Fan = SortableElement(({ fan, sortable }: { fan: ActiveFan, sortable: boolean }): ReactComponent => {
  return (
    <li className={classNames('ActiveFan', { sortable })}>
      <div className="ActiveFanImage">
        <img src={fan.snapshot} alt="fan-snapshot" />
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
          <buttons className="btn white">Send to backstage</buttons>
          <buttons className="btn white">Call</buttons>
          <buttons className="btn white">Chat</buttons>
          <buttons className="btn white">Kick</buttons>
        </div>
      </div>
    </li>
  );
});

const SortableFanList: { fans: ActiveFan[] } => ReactComponent = SortableContainer(({ fans }: { fans: ActiveFan[]}): ReactComponent => {
  const sortable = fans.length > 1;
  return (
    <ul className={classNames('ActiveFanList', { sortable })} >
      {fans.map((fan: ActiveFan, index: number): ReactComponent => (
        <Fan key={`fan-${fan.id}`} index={index} fan={fan} sortable={sortable} /> // eslint-disab
      ))}
    </ul>
  );
});

type BaseProps = { activeFans: ActiveFan[] };
type DispatchProps = { reorderFans: ActiveFanOrderUpdate => void };
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
    const { activeFans } = this.props;
    return (
      <SortableFanList fans={activeFans} onSortEnd={onSortEnd} lockAxis="y" helperClass="ProducerSidePanel-reordering" />
    );
  }
}

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  reorderFans: (update: ActiveFanOrderUpdate): void => dispatch(reorderActiveFans(update)),
});

export default connect(null, mapDispatchToProps)(ActiveFanList);
