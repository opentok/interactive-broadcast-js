// @flow
import R from 'ramda';
import { toastr } from 'react-redux-toastr';
import { validateUser } from './auth';
import { startCountdown, setBroadcastEventStatus, connectToInteractive } from './broadcast';
import { getEventWithCredentials } from '../services/api';
import opentok from '../services/opentok';

const { changeVolume, toggleLocalAudio, toggleLocalVideo } = opentok;

const newBackstageFan = (): void => toastr.info('A new FAN has been moved to backstage', { showCloseButton: false });

const onSignal = (dispatch: Dispatch): SignalListener => ({ type, data, from }: Signal) => {
  const signalData = data ? JSON.parse(data) : {};
  const signalType = R.last(R.split(':', type));
  const fromData = JSON.parse(from.data);
  const fromProducer = fromData.userType === 'producer';

  switch (signalType) {
    case 'goLive':
      if (fromProducer) {
        R.forEach(dispatch, [setBroadcastEventStatus('live'), startCountdown()]);
      }
      break;
    case 'videoOnOff':
      fromProducer && toggleLocalVideo(signalData.video === 'on');
      break;
    case 'muteAudio':
      fromProducer && toggleLocalAudio(signalData.mute === 'off');
      break;
    case 'changeVolume':
      fromProducer && changeVolume('stage', signalData.userType, signalData.volume);
      break;
    case 'chatMessage': // @TODO
    case 'privateCall': // @TODO
    case 'endPrivateCall': // @TODO
    case 'openChat': // @TODO
    case 'newBackstageFan':
      fromProducer && newBackstageFan();
      break;
    case 'finishEvent':
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
