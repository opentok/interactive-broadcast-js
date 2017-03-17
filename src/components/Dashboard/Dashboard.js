// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { getBroadcastEvents } from '../../actions/events';
import DashboardHeader from './components/DashboardHeader';
import DashboardEvents from './components/DashboardEvents';
import './Dashboard.css';

/* beautify preserve:start */
type BaseProps = { user: User };
type DispatchProps = { loadEvents: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Dashboard extends Component {
  props: Props;

  componentDidMount() {
    this.props.loadEvents(this.props.user.id);
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

const mapStateToProps = (state: State): BaseProps => R.pick(['user'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (userId: string) => {
      dispatch(getBroadcastEvents(userId));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
