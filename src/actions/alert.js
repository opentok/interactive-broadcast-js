// @flow


const setAlert: ActionCreator = (options: AlertState): AlertAction => ({
  type: 'SET_ALERT',
  options,
});

const resetAlert: ActionCreator = (): AlertAction => ({
  type: 'RESET_ALERT',
});

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

const setInfo: ThunkActionCreator = (title: null | string, text: string): Thunk =>
  (dispatch: Dispatch) => {
    const options = {
      show: true,
      type: 'info',
      title,
      text,
      onConfirm: (): void => dispatch(resetAlert()),
    };
    dispatch(setAlert(options));
  };



module.exports = {
  setAlert,
  setError,
  setInfo,
  resetAlert,
};
