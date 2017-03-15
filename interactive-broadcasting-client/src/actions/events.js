// @flow

import R from 'ramda';
import { browserHistory } from 'react-router';
import { getEvents, deleteEvent } from '../services/api';
import { setAlert } from './alert';

const setEvents: ActionCreator = (events: BroadcastEvent[]): EventsAction => ({
  type: 'SET_EVENTS',
  events,
});

const removeEvent: ActionCreator = (id: string): EventsActions => ({
  type: 'REMOVE_EVENT',
  id,
});

const getBroadcastEvents: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    getEvents()
      .then((events: BroadcastEvent[]) => {
        dispatch(setEvents(events));
        browserHistory.push('/admin');
      });
  };

const filterBroadcastEvents: ActionCreator = (filter: EventFilter): EventsAction => ({
  type: 'FILTER_EVENTS',
  filter,
});

const sortBroadcastEvents: ActionCreator = (sortBy: EventSorting): EventsAction => ({
  type: 'SORT_EVENTS',
  sortBy,
});

const confirmDeleteEvent: ThunkActionCreator = (id: string): Thunk =>
  (dispatch: Dispatch) => {
    deleteEvent(id)
    .then(dispatch(removeEvent(id)))
    .catch((error: Error): void => console.log(error));
  };

const deleteBroadcastEvent: ThunkActionCreator = (id: string): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertOptions = {
      show: true,
      type: 'warning',
      title: '',
      text: '',
      onConfirm: R.partial(confirmDeleteEvent, [id]),
    };
    dispatch(setAlert(options));
  };

module.exports = {
  getBroadcastEvents,
  filterBroadcastEvents,
  sortBroadcastEvents,
  deleteBroadcastEvent,
};

