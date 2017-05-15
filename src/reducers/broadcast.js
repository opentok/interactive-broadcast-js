// @flow
import R from 'ramda';

const participantState = (stream?: Stream | null = null): ParticipantState => ({
  connected: !!stream,
  stream,
  networkQuality: null,
  video: !!R.prop('hasVideo', stream || {}),
  audio: !!R.prop('hasAudio', stream || {}),
  volume: 100,
});

// Reorder the active fans array
const updateFanOrder = (activeFans: ActiveFan[], update: ActiveFanOrderUpdate): ActiveFan[] => {
  const { oldIndex, newIndex } = update;
  return R.insert(newIndex, activeFans[oldIndex], R.remove(oldIndex, 1, activeFans));
};

const snapshot = 'https://assets.tokbox.com/solutions/images/tokbox.png';
const initialState = (): BroadcastState => ({
  event: null,
  connected: false,
  backstageConnected: false,
  presenceConnected: false,
  publishOnlyEnabled: false,
  publishers: {
    camera: null,
  },
  subscribers: {
    camera: null,
  },
  meta: null,
  participants: {
    fan: participantState(),
    celebrity: participantState(),
    host: participantState(),
    backstageFan: participantState(),
  },
  // activeFans: [],
  activeFans: [
    { id: 'ad98fh', name: 'tim', browser: 'Firefox', connectionQuality: null, snapshot },
    { id: 'bdbaz8', name: 'aaron', browser: 'Chrome', connectionQuality: 'good', snapshot },
    { id: 'pnadf9', name: 'german', browser: 'Chrome', connectionQuality: 'fair', snapshot },
  ],
});

const broadcast = (state: BroadcastState = initialState(), action: BroadcastAction): BroadcastState => {
  switch (action.type) {
    case 'SET_PUBLISH_ONLY_ENABLED':
      return R.assoc('publishOnlyEnabled', action.publishOnlyEnabled, state);
    case 'BROADCAST_PARTICIPANT_JOINED':
      return R.assocPath(['participants', action.participantType], participantState(action.stream), state);
    case 'BROADCAST_PARTICIPANT_LEFT':
      return R.assocPath(['participants', action.participantType], participantState(), state);
    case 'PARTICIPANT_PROPERTY_CHANGED':
      return R.assocPath(['participants', action.participantType, action.update.property], action.update.value, state);
    case 'SET_BROADCAST_STATE':
      return R.assoc('state', action.state, state);
    case 'SET_BROADCAST_EVENT':
      return R.assoc('event', action.event, state);
    case 'SET_BROADCAST_EVENT_STATUS':
      return R.assoc('event', R.assoc('status', action.status, state.event), state);
    case 'BROADCAST_CONNECTED':
      return R.assoc('connected', action.connected, state);
    case 'BACKSTAGE_CONNECTED':
      return R.assoc('backstageConnected', action.connected, state);
    case 'BROADCAST_PRESENCE_CONNECTED':
      return R.assoc('presenceConnected', action.connected, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState();
    case 'REORDER_BROADCAST_ACTIVE_FANS':
      return R.assoc('activeFans', updateFanOrder(state.activeFans, action.update), state);
    default:
      return state;
  }
};


export default broadcast;
