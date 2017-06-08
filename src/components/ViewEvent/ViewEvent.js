// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import { getBroadcastEvents } from '../../actions/events';
import Loading from '../../components/Common/Loading';
import defaultImg from '../../images/TAB_VIDEO_PREVIEW_LS.jpg';
import './ViewEvent.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: EventId } };
type BaseProps = {
  user: CurrentUserState,
  events: null | BroadcastEventMap,
  eventId: null | EventId
};
type DispatchProps = {
  loadEvents: UserId => void
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class UpdateEvent extends Component {
  props: Props;
  constructor(props: Props) {
    super(props);
    this.state = {
      errors: null,
      dateTimeSet: false,
    };
  }
  componentDidMount() {
    if (!this.props.events) {
      this.props.loadEvents(R.path(['user', 'id'], this.props));
    }
  }
  render(): ReactComponent {
    const { eventId } = this.props;
    const event = R.pathOr(null, ['events', eventId], this.props);
    if (!event) return <Loading />;
    const poster = event.startImage || defaultImg;
    return (
      <div className="ViewEvent">
        <div className="ViewEvent-header">
          <Link to="/admin">Back to Events</Link>
          <h3>{event.name}</h3>
        </div>
        <div>
          <video src={event.archiveUrl} preload="metadata" poster={poster} controls />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr(null, ['params', 'id'], ownProps),
  events: R.path(['events', 'map'], state),
  user: state.currentUser,
  state,
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
  loadEvents: (userId: UserId) => {
    dispatch(getBroadcastEvents(userId));
  },
});


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UpdateEvent));
