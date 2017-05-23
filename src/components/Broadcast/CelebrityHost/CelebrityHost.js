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
import Chat from '../../../components/Common/Chat';
import { disconnect } from '../../../services/opentok';
import './CelebrityHost.css';

/* beautify preserve:start */

type InitialProps = { params: { hostUrl: string, celebrityUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celebrity',
  userUrl: string,
  broadcast: BroadcastState
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
    if (R.pathEq(['broadcast', 'event', 'status'], 'closed', nextProps)) { disconnect(); }
  }

  render(): ReactComponent {
    const { userType, togglePublishOnly, broadcast } = this.props;
    const { event, participants, publishOnlyEnabled, inPrivateCall, chats } = broadcast;
    const producerChat = R.prop('producer', chats);
    if (!event) return <Loading />;
    const availableParticipants = publishOnlyEnabled ? null : participants;
    return (
      <div className="CelebrityHost">
        <div className="Container">
          <CelebrityHostHeader
            name={event.name}
            status={event.status}
            userType={userType}
            togglePublishOnly={togglePublishOnly}
            publishOnlyEnabled={publishOnlyEnabled}
            inPrivateCall={inPrivateCall}
          />
          <CelebrityHostBody
            endImage={event.endImage}
            participants={availableParticipants}
            status={event.status}
            userType={userType}
          />
          <div className="HostCelebChat" >
            { producerChat && <Chat chat={producerChat} /> }
          </div>
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
    broadcast: R.prop('broadcast', state),
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
