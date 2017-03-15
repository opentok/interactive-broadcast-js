// @flow
import R from 'ramda';

const initialState: EventsState = {
  list: [],
  filter: 'all',
  sorting: { sortBy: 'mostRecent', order: 'descending' },
};
const events = (state: EventsState = initialState, action: EventsAction): EventsState => {
  switch (action.type) {
    case 'SET_EVENTS':
      return R.assoc('list', action.events, state);
    case 'FILTER_EVENTS':
      return R.assoc('filter', action.filter, state);
    default:
      return state;
  }
};

export default events;





