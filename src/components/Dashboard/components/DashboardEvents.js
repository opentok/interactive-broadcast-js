// @flow
import React from 'react';
import EventList from './EventList';
import FilterEvents from './FilterEvents';
import SortEvents from './SortEvents';
import { filterAndSort } from '../../../services/eventFiltering';
import './DashboardEvents.css';

/* beautify preserve:start */
type Props = {
  events: EventsState
};
/* beautify preserve:end */

const DashboardEvents = ({ events }: Props): ReactComponent =>
  <div className="DashboardEvents admin-page-content">
    <div className="DashboardEvents-controls">
      <FilterEvents />
      <SortEvents />
    </div>
    <EventList events={filterAndSort(events)} />
  </div>;

export default DashboardEvents;

