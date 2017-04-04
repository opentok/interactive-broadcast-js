// @flow
import R from 'ramda';

const setAlert: ActionCreator = (options: AlertState): AlertAction => ({
  type: 'SET_ALERT',
  options,
});

const resetAlert: ActionCreator = (): AlertAction => ({
  type: 'RESET_ALERT',
});

const setWarning: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'warning',
      title: 'Warning',
      text: '',
      onConfirm: (): void => dispatch(resetAlert()),
      showCancelButton: true,
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };
const setSuccess: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'success',
      title: 'Success',
      text: null,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };

const setError: ThunkActionCreator = (text: string): Thunk =>
  (dispatch: Dispatch) => {
    const options = {
      show: true,
      type: 'error',
      title: 'Error',
      text,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(options));
  };

const setInfo: ThunkActionCreator = (options: AlertPartialOptions): Thunk =>
  (dispatch: Dispatch) => {
    const defaultOptions = {
      show: true,
      type: 'info',
      title: null,
      text: null,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(R.merge(defaultOptions, options)));
  };



module.exports = {
  setAlert,
  setError,
  setInfo,
  setSuccess,
  setWarning,
  resetAlert,
};
