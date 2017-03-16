// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBroadcastEvents } from '../../actions/events';
import DashboardHeader from './components/DashboardHeader';
import DashboardEvents from './components/DashboardEvents';
import './Dashboard.css';

/* beautify preserve:start */
type Props = { loadEvents: Unit };
/* beautify preserve:end */

class Dashboard extends Component {
  props: Props;

  componentDidMount() {
    this.props.loadEvents();
  }

  render(): ReactComponent {
    return (
      <div className="Dashboard">
        <DashboardHeader />
        <DashboardEvents />
      </div>
    );
  }
}

const mapDispatchToProps: MapDispatchToProps<Props> = (dispatch: Dispatch): Props =>
  ({
    loadEvents: () => {
      dispatch(getBroadcastEvents());
    },
  });
export default connect(null, mapDispatchToProps)(Dashboard);
