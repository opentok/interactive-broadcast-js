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

const initialState = (): BroadcastState => ({
  event: null,
  connected: false,
  backstageConnected: false,
  presenceConnected: false,
  publishOnlyEnabled: false,
  inPrivateCall: null,
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
  activeFans: {
    map: {},
    order: [],
  },
});

const activeFansUpdate = (activeFans: ActiveFans, update: ActiveFanMap): ActiveFans => {
  const currentOrder = R.prop('order', activeFans);
  const buildOrder = (): UserId[] => {
    const fanLeftLine = R.gt(R.length(currentOrder), R.length(R.keys(update)));
    if (R.isEmpty(currentOrder)) {
      return R.keys(update);
    }
    if (fanLeftLine) {
      return R.without(R.without(R.keys(update), currentOrder), currentOrder);
    }
    return R.concat(currentOrder, R.without(currentOrder, R.keys(update)));
  };

  return { map: R.defaultTo({})(update), order: buildOrder() };
};

// Reorder the active fans array
const updateFanOrder = (activeFans: ActiveFans, update: ActiveFanOrderUpdate): ActiveFans => {
  const { order } = activeFans;
  const { oldIndex, newIndex } = update;
  return R.insert(newIndex, order[oldIndex], R.remove(oldIndex, 1, order));
};

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
      return R.merge(action.state, state);
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
    case 'START_PRIVATE_CALL':
      return R.assoc('inPrivateCall', action.participant, state);
    case 'END_PRIVATE_CALL':
      return R.assoc('inPrivateCall', null, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState();
    case 'UPDATE_ACTIVE_FANS':
      return R.assoc('activeFans', activeFansUpdate(state.activeFans, action.update), state);
    case 'REORDER_BROADCAST_ACTIVE_FANS':
      return R.assocPath(['activeFans', 'order'], updateFanOrder(state.activeFans, action.update), state);
    default:
      return state;
  }
};


export default broadcast;
