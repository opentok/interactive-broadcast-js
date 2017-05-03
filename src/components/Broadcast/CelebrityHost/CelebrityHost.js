// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { toastr } from 'react-redux-toastr';
import { validateUser } from '../../../actions/auth';
import { initializeBroadcast, startCountdown } from '../../../actions/celebrityHost';
import { setBroadcastState, publishOnly, setBroadcastEventStatus } from '../../../actions/broadcast';
import { setInfo, resetAlert } from '../../../actions/alert';
import CelebrityHostHeader from './components/CelebrityHostHeader';
import CelebrityHostBody from './components/CelebrityHostBody';
import Loading from '../../../components/Common/Loading';
import { toggleLocalVideo, toggleLocalAudio, disconnect, changeVolume } from '../../../services/opentok';
import './CelebrityHost.css';

/* beautify preserve:start */

type InitialProps = { params: { hostUrl: string, celebrityUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celebrity',
  userUrl: string,
  eventData: BroadcastEvent,
  status: EventStatus,
  broadcastState: BroadcastState,
  participants: BroadcastParticipants,
  publishOnlyEnabled: boolean
};
type DispatchProps = {
  init: CelebHostInitOptions => void,
  changeEventStatus: (event: EventStatus) => void,
  togglePublishOnly: (enable: boolean) => void
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

class CelebrityHost extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;
  signalListener: SignalListener;
  changeStatus: EventStatus => void;

  constructor(props: Props) {
    super(props);
  }

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
    const currentStatus = this.props.status;
    const newStatus = nextProps.status;
  }

  render(): ReactComponent {
    const { eventData, userType, status, broadcastState, togglePublishOnly, publishOnlyEnabled, participants } = this.props;
    const availableParticipants = publishOnlyEnabled ? null : participants;
    if (!eventData) return <Loading />;
    return (
      <div className="CelebrityHost">
        <div className="Container">
          <CelebrityHostHeader
            name={eventData.name}
            status={status}
            userType={userType}
            togglePublishOnly={togglePublishOnly}
            publishOnlyEnabled={publishOnlyEnabled}
          />
          <CelebrityHostBody
            endImage={eventData.endImage}
            participants={availableParticipants}
            status={status}
            userType={userType}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { hostUrl, celebrityUrl } = ownProps.params;
  return {
    adminId: R.path(['params', 'adminId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    userUrl: hostUrl || celebrityUrl,
    eventData: R.path(['broadcast', 'event'], state),
    status: R.path(['broadcast', 'event', 'status'], state),
    broadcastState: R.path(['broadcast', 'state'], state),
    participants: R.path(['broadcast', 'participants'], state),
    publishOnlyEnabled: R.path(['broadcast', 'publishOnlyEnabled'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  init: (options: CelebHostInitOptions): void => dispatch(initializeBroadcast(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  showCountdown: (): void => dispatch(startCountdown()),
  togglePublishOnly: (enable: boolean): void => dispatch(publishOnly()),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CelebrityHost));
