// @flow
import { browserHistory } from 'react-router';
import { getEvents } from '../services/api';

const setEvents: ActionCreator = (events: BroadcastEvent[]): EventsAction => ({
  type: 'SET_EVENTS',
  events,
});

const getBroadcastEvents: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    getEvents()
      .then((events: BroadcastEvent[]) => {
        dispatch(setEvents(events));
        browserHistory.push('/admin');
      });
  };

module.exports = {
  getBroadcastEvents,
};

