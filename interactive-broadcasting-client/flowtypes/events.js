// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */
declare type BroadcastEvent = {
  id: string,
  name: string,
  status: 'notStarted' | 'preShow' | 'live' | 'closed',
  archive: boolean,
  fanUrl: string,
  hostUrl: string,
  showEnded: string,
  showStarted: string
}

declare type EventFilter = 'all' | 'current' | 'archived';
declare type EventSorting = { sortBy: 'mostRecent' | 'startDate' | 'state', order: 'ascending' | 'descending' }
declare type EventsState = { list: BroadcastEvent[], filter: EventFilter, sorting: EventSorting }
declare type EventsAction =
  { type: 'GET_EVENTS', events: BroadcastEvent[] } |
  { type: 'SET_EVENTS', events: BroadcastEvent[] };
