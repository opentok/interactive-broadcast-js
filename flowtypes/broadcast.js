// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */
declare type BroadcastState = {
  event: null | BroadcastEvent,
  connected: boolean
};

declare type ParticipantType = 'backstageFan' | 'fan' | 'host' | 'celebrity';


declare type BroadcastAction =
  { type: 'SET_BROADCAST_EVENT', event: BroadcastEvent } |
  { type: 'RESET_BROADCAST_EVENT' } |
  { type: 'BROADCAST_CONNECTED', connected: boolean };
