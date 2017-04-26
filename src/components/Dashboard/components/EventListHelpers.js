import React from 'react';
import R from 'ramda';
import { Link } from 'react-router';
import moment from 'moment';
import Icon from 'react-fontawesome';

/** Event Name */
type NameProps = { id: string, status: string, name: string };
const eventName = ({ id, status, name }: NameProps): ReactComponent =>  // eslint-disable-line no-confusing-arrow
  status === 'closed' ?
    <span>{name}</span> :
    <Link to={`events/${id}/edit`}>{name}</Link>;

/** Event Timestamp */
type TimeProps = { id: string, status: EventStatus, dateTimeStart: string, dateTimeEnd: string, showStartedAt: string, showEndedAt: string };
const eventTime = ({ id, status, dateTimeStart = '', dateTimeEnd = '', showStartedAt = '', showEndedAt = '' }: TimeProps): ReactElement => {

  const formattedDate = (d: string): string => moment(d).format('MMM DD, YYYY hh:mm A');
  const formattedDuration = (start: string, end: string): string => moment.utc(moment(end).diff(moment(start))).format('HH:mm:ss');

  const notEmpty = R.complement(R.isEmpty);
  const hasDates = R.and(notEmpty(dateTimeStart), notEmpty(dateTimeEnd));
  const hasStartEndTimes = R.and(notEmpty(showStartedAt), notEmpty(showEndedAt));

  const dateText = hasDates ? `${formattedDate(dateTimeStart)} to ${formattedDate(dateTimeEnd)}` : 'Date not provided';
  const durationText = hasStartEndTimes && status === 'closed' ? formattedDuration(showStartedAt, showEndedAt) : null;

  const date = (): ReactComponent => <div className="date" key={`event-date-${id}`}>{dateText}</div>;
  const duration = (): ReactComponent =>
    <div className="duration" key={`event-duration-${id}`}>
      <Icon name="hourglass-2" />Total time consumed: {durationText}
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
      return { style: 'preshow', text: 'Preshow' };
    default:
      return { style: '', text: '' };
  }
};

module.exports = {
  eventName,
  eventTime,
  eventStatus,
};
