// @flow

const setAlert: ActionCreator = (options: AlertState): AlertAction => {
  return ({
    type: 'SET_ALERT',
    options,
  });
};

const resetAlert: ActionCreator = (): AlertAction => ({
  type: 'RESET_ALERT',
});


module.exports = {
  setAlert,
  resetAlert,
};
