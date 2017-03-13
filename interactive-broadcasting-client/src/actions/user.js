// @flow
import { browserHistory } from 'react-router';
import { getAdmin } from '../services/api';

const logIn: ActionCreator = (user: User): UserAction => ({
  type: 'LOG_IN',
  user,
});

const logOut: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    dispatch({ type: 'LOG_OUT' });
    browserHistory.push('/');
  };

const validate: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch) => {
    getAdmin(userId)
      .then((user: User) => {
        dispatch(logIn(user));
        browserHistory.push('/admin');
      });
  };

module.exports = {
  validate,
  logIn,
  logOut,
};
