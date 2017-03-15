// @flow
import R from 'ramda';
import { browserHistory } from 'react-router';
import firebase from '../services/firebase';
import { getAdmin } from '../services/api';
import { logIn } from './user';

const authError: ActionCreator = (error: null | Error): AuthAction => ({
  type: 'AUTH_ERROR',
  error,
});

const validate: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch) => {
    getAdmin(userId)
      .then((user: User) => {
        dispatch(logIn(user));
        browserHistory.push('/admin');
      });
  };

const authenticate: ThunkActionCreator = ({ email, password }: AuthCredentials): Thunk =>
  (dispatch: Dispatch) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((data: Response): void => dispatch(validate(R.prop('uid', data))))
      .catch((error: Error): void => dispatch(authError(error)));
  };

module.exports = {
  authenticate,
};
