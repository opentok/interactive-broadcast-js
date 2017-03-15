// @flow
import R from 'ramda';

const initialState: EventsState = {
  list: [],
  filter: 'all',
  sorting: { sortBy: 'mostRecent', order: 'descending' },
};

// eslint-disable-next-line no-confusing-arrow
const reverseOrder = (current: EventOrderOption): EventOrderOption => current === 'ascending' ? 'descending' : 'ascending';

const events = (state: EventsState = initialState, action: EventsAction): EventsState => {
  switch (action.type) {
    case 'SET_EVENTS':
      return R.assoc('list', action.events, state);
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





