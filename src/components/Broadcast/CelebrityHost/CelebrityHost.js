// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { toastr } from 'react-redux-toastr';
import { validateUser } from '../../../actions/auth';
import { initCelebHost, setBroadcastState, startCountdown, publishOnly, setBroadcastEventStatus } from '../../../actions/broadcast';
import { setInfo, resetAlert } from '../../../actions/alert';
import CelebrityHostHeader from './components/CelebrityHostHeader';
import CelebrityHostBody from './components/CelebrityHostBody';
import Loading from '../../../components/Common/Loading';
import { toggleLocalVideo, toggleLocalAudio, disconnect, changeVolume } from '../../../services/opentok';
import './CelebrityHost.css';

/* beautify preserve:start */
type InitialProps = { params: { hostUrl: string, celebrityUrl: string, adminId: string } };
type DispatchProps = {
  init: () => void,
  changeEventStatus: (event: BroadcastEvent) => void,
  togglePublishOnly: (enable: boolean) => void
};
type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

class CelebrityHost extends Component {

  props: Props;
  init: Unit;
  changeEventStatus: Unit;

  constructor(props: Props) {
    super(props);
    this.signalListener = this.signalListener.bind(this);
    this.changeStatus = this.changeStatus.bind(this);
  }

  componentDidMount() {
    const { adminId, userType, userUrl, init } = this.props;
    const options = {
      adminId,
      userType,
      userUrl,
      onSignal: this.signalListener,
    };
    init(options);
  }

  signalListener({ type, data, from }: OTSignal) {
    const signalData = data ? JSON.parse(data) : {};
    const fromData = JSON.parse(from.data);
    const fromProducer = fromData.userType === 'producer';
    switch (type) {
      case 'signal:goLive':
        fromProducer && this.changeStatus('live');
        break;
      case 'signal:videoOnOff':
        fromProducer && toggleLocalVideo(signalData.video === 'on');
        break;
      case 'signal:muteAudio':
        fromProducer && toggleLocalAudio(signalData.mute === 'off');
        break;
      case 'signal:changeVolume':
        fromProducer && changeVolume(signalData.userType, signalData.volume, true);
        break;
      case 'signal:chatMessage': // @TODO
      case 'signal:privateCall': // @TODO
      case 'signal:endPrivateCall': // @TODO
      case 'signal:openChat': // @TODO
      case 'signal:newBackstageFan':
        fromProducer && newBackstageFan();
        break;
      case 'signal:finishEvent':
        fromProducer && this.changeStatus('closed');
        break;
      default:
        break;
    }
  }

  changeStatus(newStatus: EventStatus) {
    const { eventData, changeEventStatus, showCountdown } = this.props;
    newStatus === 'live' && showCountdown();
    newStatus === 'closed' && disconnect();
    changeEventStatus(newStatus);
  }

  render(): ReactComponent {
    const { eventData, userType, status, broadcastState, togglePublishOnly, publishOnlyEnabled, participants } = this.props;
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
            participants={!publishOnlyEnabled && participants}
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
  init: (options: initOptions): void => dispatch(initCelebHost(options)),
  changeEventStatus: (status: EventStatus): void => dispatch(setBroadcastEventStatus(status)),
  showCountdown: (): void => dispatch(startCountdown()),
  togglePublishOnly: (enable: boolean): void => dispatch(publishOnly()),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CelebrityHost));
