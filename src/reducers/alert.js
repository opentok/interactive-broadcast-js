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

const alert = (state: AlertState = initialState, action: AlertAction): AlertState => {
  switch (action.type) {
    case 'RESET_ALERT':
      return R.merge(state, initialState);
    case 'SET_ALERT':
      return R.merge(state, action.options);
    default:
      return state;
  }
};

export default alert;
