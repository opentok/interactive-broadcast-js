// @flow
import { browserHistory } from 'react-router';

const logIn: ActionCreator = (user: User): UserAction => ({
  type: 'LOGIN',
  user,
});

const logOut: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    dispatch({ type: 'LOGOUT' });
    browserHistory.push('/');
  };

module.exports = {
  logIn,
  logOut,
};
