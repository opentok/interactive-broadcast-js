// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { toastr } from 'react-redux-toastr';
import { setBroadcastEventStatus } from '../../../actions/broadcast';
import { initializeBroadcast } from '../../../actions/fan';
import FanHeader from './components/FanHeader';
import FanBody from './components/FanBody';
import Loading from '../../../components/Common/Loading';
import { toggleLocalVideo, toggleLocalAudio, disconnect, changeVolume } from '../../../services/opentok';
import './Fan.css';

/* beautify preserve:start */
type InitialProps = { params: { hostUrl: string, fanUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celeb',
  userUrl: string,
  eventData: BroadcastEvent,
  status: EventStatus,
  broadcastState: BroadcastState,
  participants: BroadcastParticipants
};
type DispatchProps = {
  init: FanInitOptions => void,
  changeEventStatus: EventStatus => void
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

class Fan extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;

  componentDidMount() {
    const { adminId, userType, userUrl, init } = this.props;
    const options = {
      adminId,
      userType,
      userUrl,
    };
    init(options);
  }

  componentWillReceiveProps(nextProps: Props) {
    // Need to check for change to event status here
    return;
    if (nextProps.broadcastState === 'closed') { disconnect(); }
  }

  render(): ReactComponent {
    const { eventData, status, broadcastState, participants } = this.props;
    if (!eventData) return <Loading />;
    console.log('broadcast state in fan', broadcastState);
    const totalStreams = parseInt(R.pathOr(0, ['meta', 'subscribers', 'total'], broadcastState), 0);
    const isClosed = R.equals(status, 'closed');
    const isLive = R.equals(status, 'live');
    return (
      <div className="Fan">
        <div className="Container">
          <FanHeader
            name={eventData.name}
            status={status}
          />
          <FanBody
            hasStreams={totalStreams > 0}
            showImage={!isLive || totalStreams === 0}
            image={isClosed ? eventData.endImage : eventData.startImage}
            participants={participants}
            isClosed={isClosed}
            isLive={isLive}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { hostUrl, fanUrl } = ownProps.params;
  return {
    adminId: R.path(['params', 'adminId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    userUrl: fanUrl,
    eventData: R.path(['broadcast', 'event'], state),
    status: R.path(['broadcast', 'event', 'status'], state),
    broadcastState: R.path(['broadcast', 'state'], state),
    participants: R.path(['broadcast', 'participants'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: FanInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Fan));
