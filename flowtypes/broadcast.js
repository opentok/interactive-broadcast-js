// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type ParticipantAVProperty = 'audio' | 'video' | 'volume';
declare type PariticipantAVProps = {
  video: boolean,
  audio: boolean,
  volume: number
}

declare type SessionName = 'stage' | 'backstage';
declare type InstancesToConnect = Array<SessionName>;

declare type NetworkQuality = 'good' | 'fair' | 'poor';

declare type ParticipantAVPropertyUpdate =
{ property: 'video', value: boolean } |
{ property: 'audio', value: boolean } |
{ property: 'volume', value: number };

declare type ParticipantState = {
  connected: boolean,
  stream: null | Stream,
  networkQuality: null | NetworkQuality,
  video: boolean,
  audio: boolean,
  volume: number
}

declare type BroadcastParticipants = {
  fan: ParticipantState,
  celebrity: ParticipantState,
  host: ParticipantState,
  backstageFan: ParticipantState
};


declare type ActiveFan = {
  id: string,
  name: string,
  browser: string,
  connectionQuality: null | NetworkQuality,
  snapshot: string
};

declare type BroadcastState = {
  event: null | BroadcastEvent,
  connected: boolean,
  presenceConnected: boolean,
  publishOnlyEnabled: boolean,
  publishers: {
    camera: null | { [publisherId: string]: Publisher}
  },
  subscribers: {
    camera: null | { [subscriberId: string]: Subscriber}
  },
  meta: null | CoreMeta,
  participants: BroadcastParticipants,
  activeFans: ActiveFan[]
};


declare type ParticipantType = 'backstageFan' | 'fan' | 'host' | 'celebrity';

declare type FanInitOptions = { adminId: UserId, userUrl: string };
declare type CelebHostInitOptions = FanInitOptions & { userType: 'celebrity' | 'host' };
declare type ActiveFanOrderUpdate = { newIndex: number, oldIndex: number };

declare type BroadcastAction =
  { type: 'SET_BROADCAST_EVENT', event: BroadcastEvent } |
  { type: 'RESET_BROADCAST_EVENT' } |
  { type: 'BACKSTAGE_CONNECTED', connected: boolean } |
  { type: 'BROADCAST_CONNECTED', connected: boolean } |
  { type: 'BROADCAST_PRESENCE_CONNECTED', connected: boolean } |
  { type: 'SET_PUBLISH_ONLY_ENABLED', publishOnlyEnabled: boolean } |
  { type: 'BROADCAST_PARTICIPANT_JOINED', participantType: ParticipantType, stream: Stream } |
  { type: 'BROADCAST_PARTICIPANT_LEFT', participantType: ParticipantType } |
  { type: 'PARTICIPANT_AV_PROPERTY_CHANGED', participantType: ParticipantType, update: ParticipantAVPropertyUpdate } |
  { type: 'SET_BROADCAST_EVENT_STATUS', status: EventStatus } |
  { type: 'SET_BROADCAST_STATE', state: CoreState } |
  { type: 'REORDER_BROADCAST_ACTIVE_FANS', update: ActiveFanOrderUpdate };
