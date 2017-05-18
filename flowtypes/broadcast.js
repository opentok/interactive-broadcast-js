// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type ParticipantAVProperty = 'audio' | 'video' | 'volume';
declare type ParticipantAVProps = {
  video: boolean,
  audio: boolean,
  volume: number
}

declare type SessionName = 'stage' | 'backstage';
declare type InstancesToConnect = Array<SessionName>;

declare type NetworkQuality = 'good' | 'fair' | 'poor';
declare type ImgData = null | string;
declare type onSnapshotReady = Unit;

declare type ParticipantAVPropertyUpdate =
{ property: 'volume', value: number } |
{ property: 'video', value: boolean } |
{ property: 'audio', value: boolean } ;

declare type ParticipantState = {
  connected: boolean,
  stream: null | Stream,
  networkQuality: null | NetworkQuality,
  video: boolean,
  audio: boolean,
  volume: number
}

declare type ParticipantWithConnection = ParticipantState & { connection: Connection };
declare type ProducerWithConnection = { connection: Connection }
declare type UserWithConnection = ParticipantWithConnection | ActiveFanWithConnection | ProducerWithConnection;

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
  mobile: boolean,
  connectionQuality: null | NetworkQuality,
  streamId: string,
  snapshot: null | string
};

declare type ActiveFanWithConnection = ActiveFan & { connection: Connection };

declare type ActiveFanMap = { [fanId: string]: ActiveFan }

declare type ActiveFanUpdate = null | {
  id?: string,
  name?: string,
  browser?: string,
  connectionQuality?: null | NetworkQuality,
  mobile?: boolean,
  snapshot?: string,
  streamId?: string
};

declare type ActiveFans = {
  order: UserId[],
  map: ActiveFanMap
}

declare type ChatId = ParticipantType | string;
declare type ProducerChats = {[chatId: ChatId]: ChatState };

declare type BroadcastState = {
  event: null | BroadcastEvent,
  connected: boolean,
  presenceConnected: boolean,
  publishOnlyEnabled: boolean,
  inPrivateCall: null | ParticipantType,
  publishers: {
    camera: null | { [publisherId: string]: Publisher}
  },
  subscribers: {
    camera: null | { [subscriberId: string]: Subscriber}
  },
  meta: null | CoreMeta,
  participants: BroadcastParticipants,
  activeFans: ActiveFans,
  chats: ProducerChats
};

declare type FanStatus = 'disconnected' | 'inLine' | 'backstage' | 'stage' | 'privateCall' | 'temporarillyMuted';

declare type FanState = {
  ableToJoin: boolean,
  setFanName: string,
  newFanSignalAckd: boolean,
  status: FanStatus
};

declare type ParticipantType = 'backstageFan' | 'fan' | 'host' | 'celebrity';

declare type FanInitOptions = { adminId: UserId, userUrl: string };
declare type CelebHostInitOptions = FanInitOptions & { userType: 'celebrity' | 'host' };
declare type ActiveFanOrderUpdate = { newIndex: number, oldIndex: number };

/**
 * Chat Types
 */

declare type ChatUser = 'activeFan' | 'producer' | ParticipantType;
declare type ChatMessage = {
  from: ConnectionId,
  to: ConnectionId,
  isMe: boolean,
  text: string,
  timestamp: number
};
declare type ChatMessagePartial = {
  text: string,
  timestamp: number,
  fromType: ChatUser,
  fromId? : UserId
};
declare type ChatState = {
    chatId: ParticipantType | UserId,
    session: SessionName,
    toType: ChatUser,
    fromType: ChatUser,
    fromId?: UserId, // This will be used to indentify active fans only
    to: UserWithConnection,
    displayed: boolean,
    minimized: boolean,
    messages: ChatMessage[]
  };

/**
 * Actions
 */

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
  { type: 'START_PRIVATE_CALL', participant: ParticipantType } |
  { type: 'END_PRIVATE_CALL' } |
  { type: 'UPDATE_ACTIVE_FANS', update: ActiveFanMap } |
  { type: 'REORDER_BROADCAST_ACTIVE_FANS', update: ActiveFanOrderUpdate } |
  { type: 'START_NEW_FAN_CHAT', fan: ActiveFanWithConnection } |
  { type: 'START_NEW_PRODUCER_CHAT', fromType: ChatUser, fromId?: UserId, producer: ProducerWithConnection } |
  { type: 'DISPLAY_CHAT', chatId: ChatId, display: boolean } |
  { type: 'NEW_CHAT_MESSAGE', chatId: ChatId, message: ChatMessage };

declare type FanAction =
  { type: 'SET_NEW_FAN_ACKD', newFanSignalAckd: boolean } |
  { type: 'SET_FAN_NAME', fanName: string } |
  { type: 'SET_FAN_STATUS', status: FanStatus } |
  { type: 'SET_ABLE_TO_JOIN', ableToJoin: boolean };


