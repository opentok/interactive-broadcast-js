import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import { getBroadcastEvents } from '../../actions/events';
import DashboardHeader from './components/DashboardHeader';
import DashboardEvents from './components/DashboardEvents';
import './Dashboard.css';

/* beautify preserve:start */
type BaseProps = {
  user: User,
  events: EventState
};
type DispatchProps = { getEvents: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Dashboard extends Component {
  props: Props;
  constructor(props: Props) {
    super(props);
    this.state = {
      here: true,
    };
  }
  componentWillMount() {
    const { user } = this.props;
    if (!user) {
      browserHistory.push('/');
    }
  }
  componentDidMount() {
    this.props.getEvents();
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

const mapStateToProps = (state: State): BaseProps => R.pick(['user', 'events'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    getEvents: () => {
      dispatch(getBroadcastEvents());
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Dashboard));
