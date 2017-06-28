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

declare type NetworkQuality = 'great' | 'good' | 'poor';
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

declare type FanParticipantState = ParticipantState & { record?: ActiveFan };
declare type ParticipantWithConnection = ParticipantState & { connection: Connection };
declare type ProducerWithConnection = { connection: Connection }
declare type UserWithConnection = ParticipantWithConnection | ActiveFanWithConnection | ProducerWithConnection;

declare type BroadcastParticipants = {
  fan: FanParticipantState,
  celebrity: ParticipantState,
  host: ParticipantState,
  backstageFan: FanParticipantState
};

declare type InteractiveFan = { uid: UserId };

declare type ActiveFan = {
  id: UserId,
  name: string,
  browser: string,
  mobile: boolean,
  networkQuality: null | NetworkQuality,
  streamId: string,
  snapshot: null | string,
  inPrivateCall: boolean,
  isBackstage: boolean,
  isOnStage: boolean
};

declare type ActiveFanWithConnection = ActiveFan & { connection: Connection };

declare type ActiveFanMap = { [fanId: string]: ActiveFan }

declare type ActiveFanUpdate = null | {
  id?: string,
  name?: string,
  browser?: string,
  networkQuality?: null | NetworkQuality,
  mobile?: boolean,
  snapshot?: string,
  streamId?: string
};

declare type ActiveFans = {
  order: UserId[],
  map: ActiveFanMap
}

declare type ChatId = ParticipantType | UserId;
declare type ProducerChats = {[chatId: ChatId]: ChatState };
declare type PrivateCallParticipant = ParticipantType | 'activeFan';
declare type PrivateCallState = null | { isWith: HostCeleb } | { isWith: FanType, fanId: UserId };


declare type BroadcastState = {
  event: null | BroadcastEvent,
  connected: boolean,
  publishOnlyEnabled: boolean,
  privateCall: PrivateCallState,
  publishers: {
    camera: null | { [publisherId: string]: Publisher}
  },
  subscribers: {
    camera: null | { [subscriberId: string]: Subscriber}
  },
  meta: null | CoreMeta,
  participants: BroadcastParticipants,
  activeFans: ActiveFans,
  chats: ProducerChats,
  stageCountdown: number,
  viewers: number,
  interactiveLimit: number,
  archiving: boolean,
  reconnecting: boolean,
  disconnected: boolean,
  elapsedTime: string
};

declare type FanStatus = 'disconnected' | 'inLine' | 'backstage' | 'stage' | 'privateCall' | 'temporarillyMuted';

declare type FanState = {
  ableToJoin: boolean,
  fanName: string,
  status: FanStatus,
  inPrivateCall: boolean,
  networkTest: {
    interval: number | null,
    timeout: number | null
  }
};

declare type FanType = 'activeFan' | 'backstageFan' | 'fan';
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
  fromId?: UserId
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
    messages: ChatMessage[],
    inPrivateCall?: boolean
  };

/**
 * Actions
 */

declare type BroadcastAction =
  { type: 'SET_BROADCAST_EVENT', event: BroadcastEvent } |
  { type: 'RESET_BROADCAST_EVENT' } |
  { type: 'BACKSTAGE_CONNECTED', connected: boolean } |
  { type: 'BROADCAST_CONNECTED', connected: boolean } |
  { type: 'SET_PUBLISH_ONLY_ENABLED', publishOnlyEnabled: boolean } |
  { type: 'BROADCAST_PARTICIPANT_JOINED', participantType: ParticipantType, stream: Stream } |
  { type: 'BROADCAST_PARTICIPANT_LEFT', participantType: ParticipantType } |
  { type: 'PARTICIPANT_AV_PROPERTY_CHANGED', participantType: ParticipantType, update: ParticipantAVPropertyUpdate } |
  { type: 'SET_BROADCAST_EVENT_STATUS', status: EventStatus } |
  { type: 'SET_BROADCAST_EVENT_SHOW_STARTED', showStartedAt: string } |
  { type: 'SET_ELAPSED_TIME', elapsedTime: string } |
  { type: 'SET_BROADCAST_STATE', state: CoreState } |
  { type: 'SET_PRIVATE_CALL_STATE', privateCall: PrivateCallState } |
  { type: 'START_PRIVATE_PARTICIPANT_CALL', participant: ParticipantType } |
  { type: 'END_PRIVATE_PARTICIPANT_CALL' } |
  { type: 'PRIVATE_ACTIVE_FAN_CALL', fanId: UserId, inPrivateCall: boolean } |
  { type: 'END_PRIVATE_ACTIVE_FAN_CALL', fan: ActiveFan } |
  { type: 'UPDATE_ACTIVE_FANS', update: ActiveFanMap } |
  { type: 'UPDATE_FAN_RECORD', fanType: 'backstageFan' | 'fan', record: ActiveFan } |
  { type: 'REORDER_BROADCAST_ACTIVE_FANS', update: ActiveFanOrderUpdate } |
  { type: 'START_NEW_FAN_CHAT', fan: ActiveFanWithConnection, toType: FanType, privateCall?: boolean } |
  { type: 'START_NEW_PARTICIPANT_CHAT', participantType: ParticipantType, participant: ParticipantWithConnection } |
  { type: 'START_NEW_PRODUCER_CHAT', fromType: ChatUser, fromId?: UserId, producer: ProducerWithConnection } |
  { type: 'UPDATE_CHAT_PROPERTY', chatId: ChatId, property: $Keys<ChatState>, update: * } |
  { type: 'REMOVE_CHAT', chatId: ChatId } |
  { type: 'DISPLAY_CHAT', chatId: ChatId, display: boolean } |
  { type: 'MINIMIZE_CHAT', chatId: ChatId, minimize: boolean } |
  { type: 'NEW_CHAT_MESSAGE', chatId: ChatId, message: ChatMessage } |
  { type: 'UPDATE_STAGE_COUNTDOWN', stageCountdown: number } |
  { type: 'UPDATE_VIEWERS', viewers: number } |
  { type: 'SET_INTERACTIVE_LIMIT', interactiveLimit: number } |
  { type: 'SET_DISCONNECTED', disconnected: boolean } |
  { type: 'SET_RECONNECTING', reconnecting: boolean } |
  { type: 'SET_ARCHIVING', archiving: boolean };

declare type FanAction =
  { type: 'SET_NEW_FAN_ACKD', newFanSignalAckd: boolean } |
  { type: 'SET_FAN_NAME', fanName: string } |
  { type: 'SET_FAN_STATUS', status: FanStatus } |
  { type: 'SET_ABLE_TO_JOIN', ableToJoin: boolean } |
  { type: 'SET_FAN_PRIVATE_CALL', inPrivateCall: boolean } |
  { type: 'SET_NETWORK_TEST_INTERVAL', interval: null | number } |
  { type: 'SET_NETWORK_TEST_TIMEOUT', timeout: null | number };
