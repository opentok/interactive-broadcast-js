// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { toastr } from 'react-redux-toastr';
import classNames from 'classnames';
import { validateUser } from '../../../actions/auth';
import { initializeBroadcast } from '../../../actions/celebrityHost';
import { setBroadcastState, publishOnly, setBroadcastEventStatus, startCountdown } from '../../../actions/broadcast';
import { setInfo, resetAlert } from '../../../actions/alert';
import CelebrityHostHeader from './components/CelebrityHostHeader';
import CelebrityHostBody from './components/CelebrityHostBody';
import Loading from '../../../components/Common/Loading';
import NoEvents from '../../../components/Common/NoEvents';
import Chat from '../../../components/Common/Chat';
import NetworkReconnect from '../../Common/NetworkReconnect';
import { disconnect } from '../../../services/opentok';
import './CelebrityHost.css';

/* beautify preserve:start */

type InitialProps = { params: { hostUrl: string, celebrityUrl: string, adminId: string } };
type BaseProps = {
  adminId: string,
  userType: 'host' | 'celebrity',
  userUrl: string,
  broadcast: BroadcastState,
  disconnected: boolean,
  authError: Error,
  isEmbed: boolean
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
    const { userType, togglePublishOnly, broadcast, disconnected, authError, isEmbed } = this.props;
    const { event, participants, publishOnlyEnabled, privateCall, chats } = broadcast;
    const producerChat = R.prop('producer', chats);
    if (authError) return <NoEvents />;
    if (!event) return <Loading />;
    const availableParticipants = publishOnlyEnabled ? null : participants;
    const mainClassNames = classNames('CelebrityHost', { CelebrityHostEmbed: isEmbed });
    return (
      <div className={mainClassNames}>
        <NetworkReconnect />
        <div className="Container">
          <CelebrityHostHeader
            name={event.name}
            status={event.status}
            userType={userType}
            togglePublishOnly={togglePublishOnly}
            publishOnlyEnabled={publishOnlyEnabled}
            privateCall={privateCall}
            disconnected={disconnected}
          />
          <CelebrityHostBody
            endImage={event.endImage.url}
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
    isEmbed: R.path(['route', 'embed'], ownProps),
    userUrl: hostUrl || celebrityUrl,
    broadcast: R.prop('broadcast', state),
    disconnected: R.path(['broadcast', 'disconnected'], state),
    authError: R.path(['auth', 'error'], state),
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
