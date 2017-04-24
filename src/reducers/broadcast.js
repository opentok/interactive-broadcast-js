// @flow
import R from 'ramda';

const initialParticipantState = {
  connected: false,
  stream: null,
  networkQuality: null,
  video: false,
  audio: false,
  volume: true,
};

const initialState = (): BroadcastState => ({
  event: null,
  connected: false,
  presenceConnected: false,
  publishOnlyEnabled: false,
  state: {
    publishers: {
      camera: null,
    },
    subscribers: {
      camera: null,
    },
    meta: null,
  },
  participants: {
    fan: R.clone(initialParticipantState),
    celebrity: R.clone(initialParticipantState),
    host: R.clone(initialParticipantState),
    backstageFan: R.clone(initialParticipantState),
  },
});

const broadcast = (state: BroadcastState = initialState(), action: BroadcastAction): BroadcastState => {
  switch (action.type) {
    case 'SET_PUBLISH_ONLY_ENABLED':
      return R.assoc('publishOnlyEnabled', action.publishOnlyEnabled, state);
    case 'SET_BROADCAST_PARTICIPANTS':
      return R.assoc('participants', action.participants, state);
    case 'SET_BROADCAST_STATE':
      return R.assoc('state', action.state, state);
    case 'SET_BROADCAST_EVENT':
      return R.assoc('event', action.event, state);
    case 'SET_BROADCAST_EVENT_STATUS': {
      const event = R.assoc('status', action.status, state.event);
      return R.assoc('event', event, state);
    }
    case 'BROADCAST_CONNECTED':
      return R.assoc('connected', action.connected, state);
    case 'BROADCAST_PRESENCE_CONNECTED':
      return R.assoc('presenceConnected', action.connected, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState();
    default:
      return state;
  }
};

export default broadcast;
