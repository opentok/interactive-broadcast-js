// @flow
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Icon from 'react-fontawesome';
import { deleteBroadcastEvent, updateStatus } from '../../../actions/events';

/** Event Actions */
type BaseProps = { event: BroadcastEvent };
type DispatchProps = { deleteEvent: BroadcastEvent => void, closeEvent: string => void };
type Props = BaseProps & DispatchProps;
const EventActions = ({ event, deleteEvent, closeEvent }: Props): ReactComponent => {
  const style = (color: string): string => classNames('btn', 'action', color);
  const { id, status, archiveUrl, uncomposed } = event;

  const start = (): ReactComponent =>
    <Link to={`events/${id}`} key={`action-start-${id}`} >
      <button className={style('green')}><Icon name="check" /> Start Event</button>
    </Link>;

  const edit = (): ReactComponent =>
    <Link to={`events/${id}/edit`} key={`action-edit-${id}`} >
      <button className={style('orange')}><Icon name="pencil" /> Edit</button>
    </Link>;

  const del = (): ReactComponent =>
    <button className={style('red')} key={`action-remove-${id}`} onClick={R.partial(deleteEvent, [event])} >
      <Icon name="remove" /> Delete
    </button>;

  const view = (): ReactComponent =>
    <Link to={`events/${id}`} key={`action-view-${id}`} >
      <button className={style(`${status === 'live' ? 'blue' : 'green'}`)}><Icon name="eye" /> View Event</button>
    </Link>;

  const end = (): ReactComponent =>
    <button className={style('grey')} key={`action-end-${id}`} onClick={R.partial(closeEvent, [id])} >
      <Icon name="times" /> End Event
    </button>;

  const close = (): ReactComponent =>
    <button className={style('grey')} key={`action-close-${id}`} onClick={R.partial(closeEvent, [id])} >
      <Icon name="times" /> Close Event
    </button>;

  const download = (): ReactComponent =>
    <button className={style('download')} key={`action-download-${id}`} onClick={() => { window.location = archiveUrl; }} >
      <Icon name="cloud-download" /> Download
    </button>;

  const viewArchive = (): ReactComponent =>
    <Link to={`events/${id}/view`} key={`action-view-${id}`} >
      <button className={style('download')} key={`action-viewArchive-${id}`} >
        <Icon name="play-circle-o" /> Watch video
      </button>
    </Link>;


  const actionButtons = (): ReactComponent[] => {
    switch (status) {
      case 'notStarted':
        return [start(), edit(), del()];
      case 'preshow':
        return [view('preshow'), close()];
      case 'live':
        return [view('live'), end()];
      case 'closed':
        return R.isNil(archiveUrl) ? [] : [uncomposed ? download() : viewArchive()];
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
    deleteEvent: (event: BroadcastEvent) => {
      dispatch(deleteBroadcastEvent(event));
    },
    closeEvent: (id: string) => {
      dispatch(updateStatus(id, 'closed'));
    },
  });

export default connect(null, mapDispatchToProps)(EventActions);
