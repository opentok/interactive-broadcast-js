// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */
declare type BroadcastEvent = {
  id: string,
  name: string,
  status: EventStatus,
  archiveEvent: boolean,
  fanUrl: string,
  hostUrl: string,
  showEnded: string,
  showStarted: string,
  startImage?: string,
  endImage?: string,
  fanUrl: string,
  celebrityUrl: string,
  hostUrl: string,
  archiveEvent: boolean,
  dateTimeStart?: string,
  dateTimeEnd?: string,
  sessionId: string,
  stageSessionId: string,
  archiveUrl?: string,
  rtmpUrl?: string,
  redirectUrl: string,
  composed: boolean,
  showStartedAt: string,
  showEndedAt: string,
  adminId: string,
  createdAt: string,
  updatedAt: string
}

declare type BroadcastEventMap = {[id: string]: BroadcastEvent};

declare type EventStatus = 'notStarted' | 'preshow' | 'live' | 'closed';
declare type EventFilter = 'all' | 'current' | 'archived';
declare type EventSortByOption = 'mostRecent' | 'startDate' | 'state';
declare type EventOrderOption = 'ascending' | 'descending';
declare type EventSorting = { sortBy: EventSortByOption, order: EventOrderOption }
declare type EventId = string;
declare type EventsState = {
  map: null | BroadcastEventMap,
  mostRecent: null | BroadcastEvent,
  filter: EventFilter,
  sorting: EventSorting,
  active: null | EventId
};
declare type EventsAction =
  { type: 'SET_EVENTS', events: BroadcastEventMap } |
  { type: 'SET_MOST_RECENT_EVENT', event: BroadcastEvent } |
  { type: 'UPDATE_EVENT', event: BroadcastEvent } |
  { type: 'FILTER_EVENTS', filter: EventFilter } |
  { type: 'SORT_EVENTS', sortBy: EventSortByOption } |
  { type: 'DELETE_BROADCAST_PROMPT', id: string, onConfirm: string => void } |
  { type: 'CREATE_EVENT', event: BroadcastEvent } |
  { type: 'REMOVE_EVENT', id: string };


declare type BroadcastEventFormData = {
    name: string,
    adminId?: string,
    startImage?: string,
    endImage?: string,
    dateTimeStart?: string,
    dateTimeEnd?: string,
    archiveEvent: boolean,
    fanUrl: string,
    fanAudioUrl: string,
    hostUrl: string,
    celebrityUrl: string,
    redirectUrl?: string,
    composed: boolean
}

declare type EventUrls = {
  fanUrl: string,
  fanAudioUrl: string,
  hostUrl: string,
  celebrityUrl: string
};
