import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import moment from 'moment';
import Icon from 'react-fontawesome';
import { deleteBroadcastEvent } from '../../../actions/events';

/** Event Name */
type NameProps = { id: string, status: string, name: string };
const eventName = ({ id, status, name }: NameProps): ReactComponent =>  // eslint-disable-line no-confusing-arrow
  status === 'closed' ?
    <span>{name}</span> :
    <Link to={`event/${id}/edit`}>{name}</Link>;

/** Event Timestamp */
type TimeProps = { id: string, status: EventStatus, showStarted: string, showEnded: string };
const eventTime = ({ id, status, showStarted = '', showEnded = '' }: TimeProps): ReactElement => {

  const formattedDate = (d: string): string => moment(d).format('MMM DD, YYYY hh:mm A');
  const formattedDuration = (start: string, end: string): string => moment.utc(moment(end).diff(moment(start))).format('HH:mm:ss');

  const notEmpty = R.complement(R.isEmpty);
  const hasTimestamps = R.and(notEmpty(showStarted), notEmpty(showEnded));

  const dateText = hasTimestamps ? `${formattedDate(showStarted)} to ${formattedDate(showEnded)}` : 'Date not provided';
  const durationText = hasTimestamps && status === 'closed' ? formattedDuration(showStarted, showEnded) : null;

  const date = (): ReactComponent => <div className="date" key={`event-date-${id}`}>{dateText}</div>;
  const duration = (): ReactComponent =>
    <div className="duration" key={`event-duration-${id}`}>
      <Icon name="clock-o" />Total time consumed: {durationText}
    </div>;

  return [date(), durationText && duration()];
};

/** Event Status (class name and text) */
const eventStatus = ({ status }: { status: EventStatus }): { style: string, text: string } => {
  switch (status) {
    case 'notStarted':
      return { style: 'created', text: 'Created' };
    case 'live':
      return { style: 'live', text: 'Live' };
    case 'closed':
      return { style: 'closed', text: 'Closed' };
    case 'preshow':
      return { style: 'preshow', text: 'Event preshow' };
    default:
      return { style: '', text: '' };
  }
};

/** Event Actions */
type ActionsBaseProps = { id: string, status: EventStatus, archiveUrl: string };
type ActionsDispatchProps = { deleteEvent: (string) => void };
type ActionsProps = ActionsBaseProps & ActionsDispatchProps;
const EventActions = ({ id, status, archiveUrl = '', deleteEvent }: ActionsProps): ReactComponent => {
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

  const end = (): ReactComponent[] =>
    <button className={style('end')} key={`action-end-${id}`} onClick={()=> console.log('ending', id)} >
      <Icon name="times" /> End Event
    </button>;

  const close = (): ReactComponent[] =>
    <button className={style('close')} key={`action-close-${id}`} onClick={()=> console.log('closing', id)} >
      <Icon name="times" /> Close Event
    </button>;

  const download = (): ReactComponent[] =>
    <button className={style('download')} key={`action-download-${id}`} onClick={()=> console.log('downloading', id)} >
      <Icon name="cloud-download" /> Download
    </button>;

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

module.exports = {
  eventName,
  eventTime,
  eventStatus,
};
