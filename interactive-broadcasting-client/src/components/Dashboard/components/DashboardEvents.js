// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import EventList from './EventList';
import FilterEvents from './FilterEvents';
import { filterAndSort } from '../../../services/eventFiltering';
import './DashboardEvents.css';


/* beautify preserve:start */
type Props = {
  events: EventsState
};
/* beautify preserve:end */

class DashboardEvents extends Component {
  constructor(props: Props) {
    super(props);
  }

  render(): ReactComponent {
    const { events } = this.props;
    return (
      <div className="DashboardEvents">
        <h3>Dashboard Events</h3>
        <div className="DashboardEvents-controls">
          <FilterEvents />
          <EventList events={filterAndSort(events)} />
          <div className="sortEvents" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): Props => R.pick(['events'], state);
export default connect(mapStateToProps)(DashboardEvents);
