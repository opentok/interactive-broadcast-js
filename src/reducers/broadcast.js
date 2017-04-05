// @flow
import R from 'ramda';

const initialState: BroadcastState = {
  event: null,
  connected: false,
};

const broadcast = (state: BroadcastState = initialState, action: BroadcastAction): BroadcastState => {
  switch (action.type) {
    case 'SET_BROADCAST_EVENT':
      return R.assoc('event', action.event, state);
    case 'BROADCAST_CONNECTED':
      return R.assoc('connected', action.connected, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState;
    default:
      return state;
  }
};

export default broadcast;





