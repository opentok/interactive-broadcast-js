// @flow
import React from 'react';
import R from 'ramda';
import classNames from 'classnames';
import EventActions from './EventActions';
import { eventName, eventTime, eventStatus } from './EventListHelpers';
import './EventList.css';

const renderEvent = (e: BroadcastEvent): ReactComponent =>
  <li className="EventList-item admin-page-list-item" key={e.id}>
    <div className="event-info">
      <div className="event-name">
        { eventName(e) }
      </div>
      <div className="event-time">
        { eventTime(e) }
      </div>
      <div className={classNames('event-status', eventStatus(e).style)}>
        {eventStatus(e).text}
      </div>
    </div>
    <EventActions event={e} />
  </li>;

type Props = { events: BroadcastEvent[] };
const EventList = ({ events }: Props): ReactComponent =>
  <ul className="EventList admin-page-list">
    {
      R.ifElse(
        R.isEmpty,
        (): ReactComponent => <div className="EventList-empty">No events available</div>,
        R.map(renderEvent) // eslint-disable-line comma-dangle
      )(events)
    }
  </ul>;

export default EventList;
