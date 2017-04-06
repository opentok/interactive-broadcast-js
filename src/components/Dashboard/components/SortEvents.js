// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import { sortBroadcastEvents } from '../../../actions/events';

type BaseProps = {
  sorting: EventSorting
};
type DispatchProps = {
  setSorting: EventSorting => void
};
type Props = BaseProps & DispatchProps;

const SortEvents = ({ sorting, setSorting }: Props): ReactComponent => {
  const { order, sortBy } = sorting;
  const iconName = order === 'descending' ? 'arrow-down' : 'arrow-up';
  return (
    <div className="sort-events">
      <span className="sort-events-label">Sort by:</span>
      <button className={classNames('btn', { active: sortBy === 'mostRecent' })} onClick={R.partial(setSorting, ['mostRecent'])}>
        <Icon name={iconName} /> Most Recent
      </button>
      <button className={classNames('btn', { active: sortBy === 'dateTimeStart' })} onClick={R.partial(setSorting, ['dateTimeStart'])}>
        <Icon name={iconName} /> Start Date
      </button>
      <button className={classNames('btn', { active: sortBy === 'state' })} onClick={R.partial(setSorting, ['state'])}>
        <Icon name={iconName} /> Event State
      </button>
    </div>
  );
};

const mapStateToProps = (state: State): Props => R.pick(['sorting'], R.prop('events', state));
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    setSorting: (sorting: EventSorting) => {
      dispatch(sortBroadcastEvents(sorting));
    },
  });

export default connect(mapStateToProps, mapDispatchToProps)(SortEvents);
