// @flow
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Icon from 'react-fontawesome';
import { deleteBroadcastEvent } from '../../../actions/events';

/** Event Actions */
type BaseProps = { id: string, status: EventStatus, archiveUrl: string };
type DispatchProps = { deleteEvent: Unit };
type Props = BaseProps & DispatchProps;
const EventActions = ({ id, status, archiveUrl = '', deleteEvent }: Props): ReactComponent => {
  const style = (type: string): string => classNames('btn', 'event-action', type);

  const start = (): ReactComponent =>
    <Link to={`events/${id}`} key={`action-start-${id}`} >
      <button className={style('start')}><Icon name="check" /> Start Event</button>
    </Link>;

  const edit = (): ReactComponent =>
    <Link to={`events/${id}/edit`} key={`action-edit-${id}`} >
      <button className={style('edit')}><Icon name="pencil" /> Edit</button>
    </Link>;

  const del = (): ReactComponent =>
    <button className={style('delete')} key={`action-remove-${id}`} onClick={R.partial(deleteEvent, [id])} >
      <Icon name="remove" /> Delete
    </button>;

  const view = (): ReactComponent =>
    <Link to={`events/${id}`} key={`action-view-${id}`} >
      <button className={style(`view ${status}`)}><Icon name="eye" /> View Event</button>
    </Link>;

  const end = (): ReactComponent =>
    <button className={style('end')} key={`action-end-${id}`} onClick={()=> console.log('ending', id)} >
      <Icon name="times" /> End Event
    </button>;

  const close = (): ReactComponent =>
    <button className={style('close')} key={`action-close-${id}`} onClick={()=> console.log('closing', id)} >
      <Icon name="times" /> Close Event
    </button>;

  const download = (): ReactComponent =>
    <button className={style('download')} key={`action-download-${id}`} onClick={()=> console.log('downloading', id)} >
      <Icon name="cloud-download" /> Download
    </button>;

  const actionButtons = (): ReactComponent[] => {
    switch (status) {
      case 'notStarted':
        return [start(), edit(), del()];
      case 'preshow':
        return [view('preshow'), close()];
      case 'live':
        return [view('live'), end()];
      case 'closed':
        return R.isEmpty(archiveUrl) ? [] : [download()];
      default:
        return [];
    }
  };

  return (
    <div className="event-actions">
      { actionButtons() }
    </div>
  );
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    deleteEvent: (id: User) => {
      dispatch(deleteBroadcastEvent(id));
    },
  });

export default connect(null, mapDispatchToProps)(EventActions);
