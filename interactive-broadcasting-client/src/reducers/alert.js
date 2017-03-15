// @flow
import R from 'ramda';

const initialState: AlertState = {
  show: false,
  type: 'info',
  title: '',
  text: '',
  onConfirm: null,
  showCancelButton: false,
};

const events = (state: AlertState = initialState, action: AlertAction): AlertAction => {
  switch (action.type) {
    case 'RESET_ALERT':
      return R.merge(state, initialState);
    case 'SET_ALERT':
      console.log('pdpdpdp', action);
      return R.merge(state, action.options);
    default:
      return state;
  }
};

export default events;
