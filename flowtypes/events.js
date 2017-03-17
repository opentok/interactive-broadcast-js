// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */
declare type BroadcastEvent = {
  id: string,
  name: string,
  status: EventStatus,
  archive: boolean,
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
declare type EventsState = { map: BroadcastEventMap, filter: EventFilter, sorting: EventSorting }
declare type EventsAction =
  { type: 'SET_EVENTS', events: BroadcastEventMap } |
  { type: 'FILTER_EVENTS', filter: EventFilter } |
  { type: 'SORT_EVENTS', sortBy: EventSortByOption } |
  { type: 'DELETE_BROADCAST_PROMPT', id: string, onConfirm: string => void } |
  { type: 'REMOVE_EVENT', id: string };
