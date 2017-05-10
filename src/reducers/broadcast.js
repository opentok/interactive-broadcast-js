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
  ableToJoin: false,
  setFanName: 'Anonymous',
});

const broadcast = (state: BroadcastState = initialState(), action: BroadcastAction): BroadcastState => {
  switch (action.type) {
    case 'SET_FAN_NAME':
      return R.assoc('fanName', action.fanName, state);
    case 'SET_ABLE_TO_JOIN':
      return R.assoc('ableToJoin', action.ableToJoin, state);
    case 'SET_PUBLISH_ONLY_ENABLED':
      return R.assoc('publishOnlyEnabled', action.publishOnlyEnabled, state);
    case 'BROADCAST_PARTICIPANT_JOINED':
      return R.assocPath(['participants', action.participantType], participantState(action.stream), state);
    case 'BROADCAST_PARTICIPANT_LEFT':
      return R.assocPath(['participants', action.participantType], null, state);
    case 'PARTICIPANT_PROPERTY_CHANGED':
      return R.assocPath(['participants', action.participantType, action.update.property], action.update.value, state);
    case 'SET_BROADCAST_STATE':
      return R.assoc('state', action.state, state);
    case 'SET_BROADCAST_EVENT':
      return R.assoc('event', action.event, state);
    case 'SET_BROADCAST_EVENT_STATUS':
      {
        const event = R.assoc('status', action.status, state.event);
        return R.assoc('event', event, state);
      }
    case 'BROADCAST_CONNECTED':
      return R.assoc('connected', action.connected, state);
    case 'BACKSTAGE_CONNECTED':
      return R.assoc('backstageConnected', action.connected, state);
    case 'BROADCAST_PRESENCE_CONNECTED':
      return R.assoc('presenceConnected', action.connected, state);
    case 'RESET_BROADCAST_EVENT':
      return initialState();
    default:
      return state;
  }
};

export default broadcast;
