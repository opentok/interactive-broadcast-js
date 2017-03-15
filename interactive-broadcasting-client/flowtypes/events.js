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
  showStarted: string
}

declare type EventStatus = 'notStarted' | 'preshow' | 'live' | 'closed';
declare type EventFilter = 'all' | 'current' | 'archived';
declare type EventSorting = { sortBy: 'mostRecent' | 'startDate' | 'state', order: 'ascending' | 'descending' }
declare type EventsState = { list: BroadcastEvent[], filter: EventFilter, sorting: EventSorting }
declare type EventsAction =
  { type: 'GET_EVENTS', events: BroadcastEvent[] } |
  { type: 'SET_EVENTS', events: BroadcastEvent[] } |
  { type: 'FILTER_EVENTS', filter: EventFilter } |
  { type: 'SORT_EVENTS', sortBy: EventSorting } |
  { type: 'DELETE_BROADCAST_PROMPT', id: string, onConfirm: string => void } |
  { type: 'REMOVE_EVENT', id: string };
  { type: 'SET_EVENTS', events: BroadcastEvent[] };
