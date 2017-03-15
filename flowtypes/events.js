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
declare type EventSortByOption = 'mostRecent' | 'startDate' | 'state';
declare type EventOrderOption = 'ascending' | 'descending';
declare type EventSorting = { sortBy: EventSortByOption, order: EventOrderOption }
declare type EventsState = { list: BroadcastEvent[], filter: EventFilter, sorting: EventSorting }
declare type EventsAction =
  { type: 'GET_EVENTS', events: BroadcastEvent[] } |
  { type: 'SET_EVENTS', events: BroadcastEvent[] } |
  { type: 'FILTER_EVENTS', filter: EventFilter } |
  { type: 'SORT_EVENTS', sortBy: EventSortByOption } |
  { type: 'DELETE_BROADCAST_PROMPT', id: string, onConfirm: string => void } |
  { type: 'REMOVE_EVENT', id: string };
