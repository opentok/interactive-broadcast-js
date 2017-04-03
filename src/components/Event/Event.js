import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import classNames from 'classnames';
import EventHeader from './components/EventHeader';
import EventSidePanel from './components/EventSidePanel';
import { getBroadcastEvents, updateBroadcastEventStatus } from '../../actions/events';
import './Event.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: string } };
type BaseProps = {
  user: User,
  event: BroadcastEvent,
  eventsLoaded: boolean
};
type DispatchProps = { loadEvents: string => void, startPreshow: string => void };

type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Event extends Component {
  props: Props;
  state: { preshowStarted: boolean, showingSidePanel: boolean };
  startPreshow: Unit;
  toggleSidePanel: Unit;
  constructor(props: Props) {
    super(props);
    this.state = {
      preshowStarted: false,
      showingSidePanel: true,
    };
    this.startPreshow = this.startPreshow.bind(this);
    this.toggleSidePanel = this.toggleSidePanel.bind(this);
  }

  startPreshow() {
    const { event } = this.props;
    if (event) {
      !R.propEq('status', 'preshow', event) && this.props.startPreshow(event.id);
      this.setState({ preshowStarted: true });
    } else {
      browserHistory.replace('/admin');
    }
  }

  toggleSidePanel() {
    this.setState({ showingSidePanel: !this.state.showingSidePanel });
  }

  componentDidMount() {
    const { eventsLoaded, user } = this.props;
    eventsLoaded ? this.startPreshow() : this.props.loadEvents(user.id);
  }

  componentDidUpdate() {
    const { eventsLoaded } = this.props;
    const { preshowStarted } = this.state;
    eventsLoaded && !preshowStarted && this.startPreshow();
  }

  render(): ReactComponent {
    const { toggleSidePanel } = this;
    const { showingSidePanel } = this.state;
    const event = R.defaultTo({})(this.props.event);

    return (
      <div className="Event">
        <div className={classNames('Event-main', { full: !showingSidePanel })} >
          <EventHeader event={event} showingSidePanel={showingSidePanel} toggleSidePanel={toggleSidePanel} />
          <div className="admin-page-content">
            { JSON.stringify(event) }
          </div>
        </div>
        <EventSidePanel hidden={!showingSidePanel} />
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: initialProps): BaseProps => ({
  eventsLoaded: !!R.path(['events', 'map'], state),
  event: R.pathOr(null, ['events', 'map', R.pathOr('', ['params', 'id'], ownProps)], state),
  user: R.prop('currentUser', state),
});
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadEvents: (userId: string) => {
      dispatch(getBroadcastEvents(userId));
    },
    startPreshow: (id: string) => {
      dispatch(updateBroadcastEventStatus(id, 'preshow'));
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Event));
