// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import { getEvents, createEvent, updateEvent, updateEventStatus, deleteEvent } from '../services/api';
import { setInfo, setSuccess, setWarning, resetAlert } from './alert';

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
    const options: AlertPartialOptions = {
      title: 'Event Image Upload',
      text: 'This may take a few seconds . . .',
      showConfirmButton: false,
    };
    dispatch(setInfo(options));
  };

const uploadEventImageSuccess: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertPartialOptions = {
      title: 'Event Image Upload',
      text: 'Your image has been uploaded.',
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setSuccess(options));
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
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const events: BroadcastEventMap = await getEvents(adminId);
      dispatch(setEvents(events));
    } catch (error) {
      console.log(error);
    }
  };

const confirmDeleteEvent: ThunkActionCreator = (id: EventId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await deleteEvent(id);
      R.forEach(dispatch, [removeEvent(id), setSuccess({ text: 'Event deleted.' })]);
    } catch (error) {
      console.log(error);
    }
  };

const createBroadcastEvent: ThunkActionCreator = (data: BroadcastEventFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const event: BroadcastEvent = await createEvent(data);
      const options: AlertPartialOptions = {
        title: 'Event Creation',
        text: `${data.name} has been created`,
        onConfirm: browserHistory.push('/admin'),
      };
      R.forEach(dispatch, [setSuccess(options), setOrUpdateEvent(event), setMostRecentEvent(event)]);
    } catch (error) {
      console.log(error);
    }
  };

const updateBroadcastEvent: ThunkActionCreator = (data: BroadcastEventFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const event: BroadcastEvent = await updateEvent(data);
      const options: AlertPartialOptions = {
        title: 'Event Update',
        text: `${data.name} has been updated`,
        onConfirm: browserHistory.push('/admin'),
      };
      R.forEach(dispatch, [setSuccess(options), setOrUpdateEvent(event)]);
    } catch (error) {
      console.log(error);
    }
  };

const updateStatus: ThunkActionCreator = (id: EventId, status: EventStatus): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const event: BroadcastEvent = await updateEventStatus(id, status);
      const options: AlertPartialOptions = {
        text: 'Event has been closed',
        onConfirm: () => {
          browserHistory.push('/admin');
          dispatch(resetAlert());
        },
      };
      R.equals(status, 'closed') && dispatch(setSuccess(options));
      dispatch(setOrUpdateEvent(event));
    } catch (error) {
      console.log(error);
    }
  };

const deleteBroadcastEvent: ThunkActionCreator = ({ id, name }: { id: EventId, name: string }): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertPartialOptions = {
      title: 'Delete Event',
      text: `Are you sure you want to delete ${name}?`,
      onConfirm: (): void => dispatch(confirmDeleteEvent(id)),
    };
    dispatch(setWarning(options));
  };

module.exports = {
  getBroadcastEvents,
  filterBroadcastEvents,
  sortBroadcastEvents,
  createBroadcastEvent,
  updateBroadcastEvent,
  updateStatus,
  deleteBroadcastEvent,
  uploadEventImage,
  uploadEventImageSuccess,
};
