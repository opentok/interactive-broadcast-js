import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
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
  state: {};
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { eventsLoaded, event, user, startPreshow } = this.props;
    if (eventsLoaded) {
      event ? startPreshow(event.id) : browserHistory.push('/admin');
    } else {
      this.props.loadEvents(user.id);
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const { eventsLoaded, event, startPreshow } = nextProps;
    if (eventsLoaded && !R.propEq('status', 'preshow', event || {})) {
      event ? startPreshow(event.id) : browserHistory.push('/admin');
    }
  }

  render(): ReactComponent {
    return (
      <div className="Event">
        The event will occur in this general area.
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
