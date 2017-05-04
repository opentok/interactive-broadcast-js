// @flow
import R from 'ramda';
import { toastr } from 'react-redux-toastr';
import { validateUser } from './auth';
import { startCountdown, setBroadcastEventStatus, connectToInteractive } from './broadcast';
// import { opentokConfig, setPublishOnly, setBroadcastEventStatus, setBroadcastState, connectToPresence } from './broadcast';
import { getEventWithCredentials } from '../services/api';
import opentok2 from '../services/opentok2';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok2;

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

const onSignal = (dispatch: Dispatch): SignalListener => ({ type, data, from }: Signal) => {
  const signalData = data ? JSON.parse(data) : {};
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';
  switch (type) {
    case 'signal:goLive':
      fromProducer && dispatch(setBroadcastEventStatus('live'));
      break;
    case 'signal:videoOnOff':
      fromProducer && toggleLocalVideo(signalData.video === 'on');
      break;
    case 'signal:muteAudio':
      fromProducer && toggleLocalAudio(signalData.mute === 'off');
      break;
    case 'signal:changeVolume':
      fromProducer && changeVolume('stage', signalData.userType, signalData.volume);
      break;
    case 'signal:chatMessage': // @TODO
    case 'signal:privateCall': // @TODO
    case 'signal:endPrivateCall': // @TODO
    case 'signal:openChat': // @TODO
    case 'signal:newBackstageFan':
      fromProducer && newBackstageFan();
      break;
    case 'signal:finishEvent':
      fromProducer && dispatch(setBroadcastEventStatus('closed'));
      break;
    default:
      break;
  }
};

const setBroadcastEventWithCredentials: ThunkActionCreator = (adminId: string, userType: string, slug: string): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const data = R.assoc(`${userType}Url`, slug, { adminId, userType });
      const eventData: HostCelebEventData = await getEventWithCredentials(data, getState().auth.authToken);
      dispatch({ type: 'SET_BROADCAST_EVENT', event: eventData });
    } catch (error) {
      console.log(error);
    }
  };


const initializeBroadcast: ThunkActionCreator = ({ adminId, userType, userUrl }: CelebHostInitOptions): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      // Get/set an Auth Token
      await dispatch(validateUser(adminId, userType, userUrl));
      // Get the event data + OT credentials
      await dispatch(setBroadcastEventWithCredentials(adminId, userType, userUrl));

      // Connect to the session
      const eventData = R.path(['broadcast', 'event'], getState());
      const { apiKey, stageToken, stageSessionId, status } = eventData;
      const credentials = { apiKey, stageSessionId, stageToken };
      status !== 'closed' && await dispatch(connectToInteractive(credentials, userType, { onSignal: onSignal(dispatch) }));
    } catch (error) {
      console.log('error', error);
    }
  };


module.exports = {
  initializeBroadcast,
  startCountdown,
};
