// @flow
import React, { Component } from 'react';
import R from 'ramda';
import classNames from 'classnames';
import ToggleEvents from './ToggleEvents';
import './DashboardEvents.css';

/* beautify preserve:start */
type Props = {
  events: BroadcastEvent[]
};
type Showing = 'all' | 'current' | 'archived';
/* beautify preserve:end */

class DashboardEvents extends Component {

  props: Props;
  state: {
    showing: Showing
  }
  toggleShowing: Showing => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      showing: 'all',
    };
    this.toggleShowing = this.toggleShowing.bind(this);
  }

  toggleShowing(type: Showing) {
    this.setState({ showing: type });
  }

  render(): ReactComponent {
    const { events } = this.props;
    const { showing } = this.state;
    const { toggleShowing } = this;
    return (
      <div className="DashboardEvents">
        <h3>Dashboard Events</h3>
        <div className="DashboardEvents-controls">
          <ToggleEvents toggle={toggleShowing} showing={showing} />
          <div className="sortEvents" />
        </div>
      </div>
    );
  }
}

export default DashboardEvents;
