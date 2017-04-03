// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { getEvents, createEvent, updateEvent, updateEventStatus, deleteEvent, getMostRecentEvent } from '../services/api';
import { setAlert, setSuccess, resetAlert } from './alert';

const setEvents: ActionCreator = (events: BroadcastEventMap): EventsAction => ({
  type: 'SET_EVENTS',
  events,
});

const setMostRecentEvent: ActionCreator = (event: BroadcastEvent): EventsAction => ({
  type: 'SET_MOST_RECENT_EVENT',
  event,
});

const setOrUpdateEvent: ActionCreator = (event: BroadcastEvent): EventsAction => ({
  type: 'UPDATE_EVENT',
  event,
});

const uploadEventImage: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertOptions = {
      show: true,
      type: 'info',
      title: 'Event Image Upload',
      text: 'This may take a few seconds . . .',
      showConfirmButton: false,
    };
    dispatch(setAlert(options));
  };

const uploadEventImageSuccess: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertOptions = {
      show: true,
      type: 'success',
      title: 'Event Image Upload',
      text: 'Your image has been uploaded.',
      showConfirmButton: true,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(options));
  };

const removeEvent: ActionCreator = (id: string): EventsAction => ({
  type: 'REMOVE_EVENT',
  id,
});

const filterBroadcastEvents: ActionCreator = (filter: EventFilter): EventsAction => ({
  type: 'FILTER_EVENTS',
  filter,
});

const sortBroadcastEvents: ActionCreator = (sortBy: EventSortByOption): EventsAction => ({
  type: 'SORT_EVENTS',
  sortBy,
});

const getBroadcastEvents: ThunkActionCreator = (adminId: string): Thunk =>
  (dispatch: Dispatch) => {
    Promise.all([getEvents(adminId), getMostRecentEvent(adminId)])
      .then((eventData: [BroadcastEventMap, BroadcastEvent]) => {
        const [events, mostRecentEvent] = eventData;
        dispatch(setEvents(events));
        dispatch(setMostRecentEvent(mostRecentEvent));
      });
  };

const confirmDeleteEvent: ThunkActionCreator = (id: EventId): Thunk =>
  (dispatch: Dispatch) => {
    const onDelete = () => {
      dispatch(removeEvent(id));
      dispatch(setSuccess('Event deleted.'));
    };
    deleteEvent(id)
      .then(onDelete)
      .catch((error: Error): void => console.log(error));
  };

const createBroadcastEvent: ThunkActionCreator = (data: BroadcastEventFormData): Thunk =>
  (dispatch: Dispatch) => {
    createEvent(data)
      .then((event: BroadcastEvent) => {
        const options: AlertOptions = {
          show: true,
          type: 'success',
          title: 'Event Creation',
          text: `${data.name} has been created`,
          onConfirm: browserHistory.push('/admin'),
        };
        dispatch(setAlert(options));
        dispatch(setOrUpdateEvent(event));
      });
  };

const updateBroadcastEvent: ThunkActionCreator = (data: BroadcastEventFormData): Thunk =>
  (dispatch: Dispatch) => {
    updateEvent(data)
      .then((event: BroadcastEventMap) => {
        const options: AlertOptions = {
          show: true,
          type: 'success',
          title: 'Event Update',
          text: `${data.name} has been updated`,
          onConfirm: browserHistory.push('/admin'),
        };
        dispatch(setAlert(options));
        dispatch(setOrUpdateEvent(event));
      });
  };

const updateBroadcastEventStatus: ThunkActionCreator = (id: EventId, status: EventStatus): Thunk =>
  (dispatch: Dispatch) => {
    updateEventStatus(id, status)
      .then((event: BroadcastEventMap) => {
        R.equals(status, 'closed') && dispatch(setSuccess('Event has been closed'));
        dispatch(setOrUpdateEvent(event));
      });
  };

const deleteBroadcastEvent: ThunkActionCreator = ({ id, name }: {id: EventId, name: string }): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertOptions = {
      show: true,
      type: 'warning',
      title: 'Delete Event',
      text: `Are you sure you want to delete ${name}?`,
      onConfirm: (): void => dispatch(confirmDeleteEvent(id)),
      showCancelButton: true,
    };
    dispatch(setAlert(options));
  };

module.exports = {
  getBroadcastEvents,
  filterBroadcastEvents,
  sortBroadcastEvents,
  createBroadcastEvent,
  updateBroadcastEvent,
  updateBroadcastEventStatus,
  deleteBroadcastEvent,
  uploadEventImage,
  uploadEventImageSuccess,
};
