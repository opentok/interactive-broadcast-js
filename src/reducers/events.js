// @flow
import R from 'ramda';

const initialState: EventsState = {
  map: null, // Set to null so we know that events haven't been loaded
  filter: 'all',
  sorting: { sortBy: 'mostRecent', order: 'descending' },
};

// eslint-disable-next-line no-confusing-arrow
const reverseOrder = (current: EventOrderOption): EventOrderOption => current === 'ascending' ? 'descending' : 'ascending';

const events = (state: EventsState = initialState, action: EventsAction): EventsState => {
  switch (action.type) {
    case 'ADD_EVENT':
      return R.assocPath(['map', action.event.id], action.event, state);
    case 'SET_EVENTS':
      return R.assoc('map', action.events, state);
    case 'UPDATE_EVENT':
      return R.assocPath(['map', action.event.id], R.merge(R.pathOr({}, ['map', action.event.id], state), action.event), state);
    case 'REMOVE_EVENT':
      return R.assoc('map', R.omit([action.id], state.map), state);
    case 'FILTER_EVENTS':
      return R.assoc('filter', action.filter, state);
    case 'SORT_EVENTS':
      // If the sortBy type is the same, we are only changing the order
      if (state.sorting.sortBy === action.sortBy) {
        return R.assocPath(['sorting', 'order'], reverseOrder(state.sorting.order), state);
      }
      // When changing the sortBy type, always revert to descending order
      return R.assoc('sorting', { sortBy: action.sortBy, order: 'descending' }, state);
    default:
      return state;
  }
};

export default events;





