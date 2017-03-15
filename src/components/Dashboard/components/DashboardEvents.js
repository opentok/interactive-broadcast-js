// @flow
import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
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
  <div className="DashboardEvents">
    <div className="DashboardEvents-controls">
      <FilterEvents />
      <SortEvents />
    </div>
    <EventList events={filterAndSort(events)} />
  </div>;

const mapStateToProps = (state: State): Props => R.pick(['events'], state);
export default connect(mapStateToProps)(DashboardEvents);

