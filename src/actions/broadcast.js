// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { updateStatus } from './events';
import { setInfo } from './alert';
import { getEvent, getAdminCredentials } from '../services/api';
import { connect, disconnect } from '../services/opentok';

const notStarted = R.propEq('status', 'notStarted');
const setStatus = { status: (s: EventStatus): EventStatus => s === 'notStarted' ? 'preshow' : s };

const connectBroadcast: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    const credentials = await getAdminCredentials(eventId);
    await connect(credentials);
    dispatch({ type: 'BROADCAST_CONNECTED', connected: true });
  };

const resetBroadcastEvent: ThunkActionCreator = (): Thunk  =>
  (dispatch: Dispatch) => {
    disconnect();
    dispatch({ type: 'RESET_BROADCAST_EVENT' });
  };

const setBroadcastEvent: ThunkActionCreator = (eventId: EventId): Thunk =>
  async (dispatch: Dispatch, getState: GetState): AsyncVoid => {
    try {
      const event = R.path(['events', 'map', eventId], getState()) || await getEvent(eventId);
      const actions = [
        updateStatus(eventId, 'preshow'),
        connectBroadcast(eventId),
        { type: 'SET_BROADCAST_EVENT', event: R.evolve(setStatus, event) },
      ];
      R.forEach(dispatch, notStarted(event) ? actions : R.tail(actions));
    } catch (error) {
      browserHistory.replace('/admin');
      dispatch(setInfo({ title: 'Event Not Found', text: `Could not find event with the ID ${eventId}` }));
    }
  };

module.exports = {
  setBroadcastEvent,
  resetBroadcastEvent,
};
